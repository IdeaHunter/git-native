#ifndef SRC_GIT_WORKER_H_
#define SRC_GIT_WORKER_H_

#include <git2.h>
#include <nan.h>
#include <functional>
#include <vector>
#include <string>
#include <ctime>
#include "./common.h"

using namespace v8;  // NOLINT(build/namespaces)
using namespace Nan;  // NOLINT(build/namespaces)

class  GitWorker: public AsyncProgressWorker {
    private:
        Callback *_progress;
        Work _work;
        int _defaultErrClass;
        const char* _error;
        GetResult _val;

    public:
       explicit GitWorker(
            Callback *progress,
            Work work,
            Local<Promise::Resolver> resolver,
            int errClass,
            const char* defaultError);

        ~GitWorker() {
        }

        void Execute(
            const AsyncProgressWorker::ExecutionProgress& nanProgress);

        void HandleProgressCallback(const char *data, size_t size);

        void HandleOKCallback();


        static void RunAsync(
            const Nan::FunctionCallbackInfo<Value>* info,
            Callback *progress,
            Work work,
            int errClass,
            const char* defaultError);
};


#endif  // SRC_GIT_WORKER_H_
