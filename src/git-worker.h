#ifndef SRC_GIT_WORKER_H_
#define SRC_GIT_WORKER_H_

#include <git2.h>
#include <nan.h>
#include <functional>


template<typename T>
using Work = std::function<int(T **res)>;

template<typename T>
using ToResult = std::function<v8::Local<v8::Value> (T* nativeResult)>;

class  GitWorker: public Nan::AsyncWorker {
    private:
        ToResult<void> _createResult;
        Work<void> _work;
        int _defaultErrClass;
        const char* _defaultError;
        int _isOk;
        void *_val;
    public:
       explicit GitWorker(
            ToResult<void> createResult,
            Work<void> work,
            v8::Local<v8::Promise::Resolver> resolver,
            int errClass,
            const char* defaultError);
        ~GitWorker();
        void Execute();
        void HandleOKCallback();
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
    auto worker = new GitWorker(
        createResult,
        work,
        resolver,
        errClass,
        defaultError);
    Nan::AsyncQueueWorker(worker);
    info->GetReturnValue().Set(scope.Escape(resolver->GetPromise()));
}

#endif  // SRC_GIT_WORKER_H_
