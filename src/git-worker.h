#ifndef SRC_GIT_WORKER_H_
#define SRC_GIT_WORKER_H_

#include <git2.h>
#include <nan.h>
#include <functional>


template<typename T>
using Work = std::function<int(T **res)>;

template<typename T>
using ToResult = v8::Local<v8::Value> (*)(T* nativeResult);

extern Nan::Callback* tickKicker;

template<typename T, typename Y>
class  GitWorker: public Nan::AsyncWorker {
    private:
        ToResult<T> _createResult;
        Work<Y> _work;
        int _defaultErrClass;
        const char* _defaultError;
        int _isOk;
        T *_val;

    public:
       explicit GitWorker(
            ToResult<T> createResult,
            Work<Y> work,
            v8::Local<v8::Promise::Resolver> resolver,
            int errClass,
            const char* defaultError) :
                AsyncWorker(nullptr),
                _createResult(createResult),
                _work(work),
                _defaultErrClass(errClass),
                _defaultError(defaultError) {
            SaveToPersistent("resolver", resolver);
        }

        ~GitWorker() {}

        void Execute() {
            _isOk =_work(&_val);
        }

        void HandleOKCallback() {
            auto resolver = GetFromPersistent("resolver")
                .template As<v8::Promise::Resolver>();

            if (!_isOk) {
                auto last = giterr_last();
                auto error = last?last->message:_defaultError;
                resolver->Reject(Nan::New(error).ToLocalChecked());
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
    Work<Y> work,
    int errClass,
    const char* defaultError) {

    Nan::EscapableHandleScope scope;
    auto resolver = v8::Promise::Resolver::New(info->GetIsolate());
    auto worker = new GitWorker<T, Y>(
        createResult,
        work,
        resolver,
        errClass,
        defaultError);
    Nan::AsyncQueueWorker(worker);
    info->GetReturnValue().Set(scope.Escape(resolver->GetPromise()));
}

#endif  // SRC_GIT_WORKER_H_
