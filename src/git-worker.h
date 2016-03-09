#ifndef SRC_GIT_WORKER_H_
#define SRC_GIT_WORKER_H_

#include <git2.h>
#include <nan.h>
#include <functional>
#include <vector>
#include <string>
#include <ctime>

class Progress {
    private:
        const int PROGESS_UNKNOWN = -1;
        uv_mutex_t async_lock;
        std::vector<std::string*> messages;
        const Nan::AsyncProgressWorker::ExecutionProgress* nanProgress;
        std::string lastStepName;
        int lastStepIdx;
        int step = 0;
        int totalSteps = 1;
        int progress = PROGESS_UNKNOWN;
        int totalProgress = PROGESS_UNKNOWN;

    public:
        struct ProgressWrapper {
            Progress *progress;
        };
        explicit Progress(
            const Nan::AsyncProgressWorker::ExecutionProgress* notifier)
            : nanProgress(notifier) {
                uv_mutex_init(&async_lock);
        }

        ~Progress() {
            uv_mutex_destroy(&async_lock);
        }

        void Step(const char* name, int stepIdx) {
            if (lastStepIdx < stepIdx)
                return;

            lastStepIdx = stepIdx;
            lastStepName = name;
            step++;
            progress = PROGESS_UNKNOWN;
            totalProgress = PROGESS_UNKNOWN;
            Update();
        }

        void Message(const char* message, int len) {
            uv_mutex_lock(&async_lock);
            messages.push_back(new std::string(message, len));
            uv_mutex_unlock(&async_lock);

            Update();
        }

        void ProgressChange(int done, int total) {
            progress = done;
            totalProgress = total;
            Update();
        }

        v8::Local<v8::Value> ToJsProgress(v8::Isolate *isolate) {
            Nan::EscapableHandleScope scope;

            v8::Local<v8::Object> obj = Nan::New<v8::Object>();

            uv_mutex_lock(&async_lock);
            int size = messages.size();
            v8::Local<v8::Array> lastMessages;
            if (size>0) {
                lastMessages = Nan::New<v8::Array>(size);
                for (int i = 0; i < size; i++) {
                    auto message = messages[i];
                    lastMessages->Set(i,
                        Nan::New(message->c_str()).ToLocalChecked());
                    delete message;
                }
                messages.clear();
            }
            uv_mutex_unlock(&async_lock);

            if (size>0)
                obj->Set(Nan::New("newMessages").ToLocalChecked(),
                    lastMessages);
            obj->Set(Nan::New("step").ToLocalChecked(), Nan::New(step));
            obj->Set(Nan::New("stepName").ToLocalChecked(),
                Nan::New(lastStepName.c_str()).ToLocalChecked());
            obj->Set(Nan::New("totalSteps").ToLocalChecked(),
                Nan::New(totalSteps));

            if (progress != PROGESS_UNKNOWN)
                obj->Set(Nan::New("progress").ToLocalChecked(),
                    Nan::New(progress));
            if (totalProgress != PROGESS_UNKNOWN)
                obj->Set(Nan::New("totalProgress").ToLocalChecked(),
                    Nan::New(totalProgress));

            return scope.Escape(obj);
        }

    private:
        void Update() {
            ProgressWrapper wrapper = {this};
            nanProgress->Send(
                reinterpret_cast<const char*>(&wrapper),
                sizeof(ProgressWrapper));
        }
};


template<typename T>
using Work = std::function<int(T **res, Progress *progress)>;

template<typename T>
using ToResult = v8::Local<v8::Value> (*)(T* nativeResult);

// using NanProgress = Nan::AsyncProgressWorker::ExecutionProgress;

extern Nan::Callback* tickKicker;

template<typename T, typename Y>
class  GitWorker: public Nan::AsyncProgressWorker {
    private:
        int number;
        Nan::Callback *_progress;
        ToResult<T> _createResult;
        Work<Y> _work;
        int _defaultErrClass;
        const char* _error;
        int _isOk;
        T *_val;

    public:
       explicit GitWorker(
            Nan::Callback *progress,
            ToResult<T> createResult,
            Work<Y> work,
            v8::Local<v8::Promise::Resolver> resolver,
            int errClass,
            const char* defaultError) :
                AsyncProgressWorker(progress),
                _progress(progress),
                _createResult(createResult),
                _work(work),
                _defaultErrClass(errClass),
                _error(defaultError) {
            SaveToPersistent("resolver", resolver);
        }

        ~GitWorker() {
        }

        void Execute(
            const Nan::AsyncProgressWorker::ExecutionProgress& nanProgress) {
            Progress progress(&nanProgress);
            _isOk =_work(&_val, &progress);
            if (!_isOk) {
                auto last = giterr_last();
                _error = last ? last->message: _error;
            }
        }

        void HandleProgressCallback(const char *data, size_t size) {
            if (!data)
                return;
            Nan::HandleScope scope;
            auto progressData = reinterpret_cast<Progress::ProgressWrapper*>(
                const_cast<char*>(data))->progress;

            v8::Local<v8::Value> msgArgs[] = {
                progressData->ToJsProgress(v8::Isolate::GetCurrent())
            };
            _progress->Call(1, msgArgs);
        }

        void HandleOKCallback() {
            auto resolver = GetFromPersistent("resolver")
                .template As<v8::Promise::Resolver>();
            if (!_isOk) {;
                resolver->Reject(Nan::New(_error).ToLocalChecked());
            } else {
                resolver->Resolve(_createResult(_val));
            }
            // HACK: tricking nodejs event queue to process resolved promise
            tickKicker->Call(0, {});
        }
};

template<typename T, typename Y>
void RunAsync(
    ToResult<T> createResult,
    const Nan::FunctionCallbackInfo<v8::Value>* info,
    Nan::Callback *progress,
    Work<Y> work,
    int errClass,
    const char* defaultError) {

    Nan::EscapableHandleScope scope;
    auto resolver = v8::Promise::Resolver::New(info->GetIsolate());
    auto worker = new GitWorker<T, Y>(
        progress,
        createResult,
        work,
        resolver,
        errClass,
        defaultError);
    Nan::AsyncQueueWorker(worker);
    info->GetReturnValue().Set(scope.Escape(resolver->GetPromise()));
}

#endif  // SRC_GIT_WORKER_H_
