#ifndef SRC_GIT_WORKER_H_
#define SRC_GIT_WORKER_H_

#include <git2.h>
#include <nan.h>
#include <functional>
#include <vector>
#include <string>
#include <ctime>
#include "./common.h"


extern Nan::Callback* tickKicker;

template<typename T>
class  GitWorker: public Nan::AsyncProgressWorker {
    private:
        Nan::Callback *_progress;
        ToResult<T> _createResult;
        Work<T> _work;
        int _defaultErrClass;
        const char* _error;
        int _isOk;
        T _val;

    public:
       explicit GitWorker(
            Nan::Callback *progress,
            ToResult<T> createResult,
            Work<T> work,
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
            _isOk =_work(&progress, &_val);
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
                resolver->Resolve(_createResult(&_val));
            }
            // HACK: tricking nodejs event queue to process resolved promise
            tickKicker->Call(0, {});
        }
};

template<typename T>
void RunAsync(
    ToResult<T> createResult,
    const Nan::FunctionCallbackInfo<v8::Value>* info,
    Nan::Callback *progress,
    Work<T> work,
    int errClass,
    const char* defaultError) {

    Nan::EscapableHandleScope scope;
    auto resolver = v8::Promise::Resolver::New(info->GetIsolate());
    auto worker = new GitWorker<T>(
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
