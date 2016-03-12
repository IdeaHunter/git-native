#ifndef SRC_COMMON_H_
#define SRC_COMMON_H_

#include <git2.h>
#include <nan.h>
#include <string>
#include <functional>
#include <vector>

using namespace std;  // NOLINT(build/namespaces)
using namespace v8;  // NOLINT(build/namespaces)
using namespace Nan;  // NOLINT(build/namespaces)

class Progress {
    private:
        const int PROGESS_UNKNOWN = -1;
        uv_mutex_t async_lock;
        vector<string*> messages;
        const AsyncProgressWorker::ExecutionProgress* nanProgress;
        string lastStepName;
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
            const Nan::AsyncProgressWorker::ExecutionProgress* notifier);

        ~Progress();

        void Step(const char* name, int stepIdx);
        void Message(const char* message, int len);
        void ProgressChange(int done, int total);
        Local<Value> ToJsProgress(Isolate *isolate);

    private:
        void Update();
};

typedef function<Local<Value>()> GetResult;
typedef function<GetResult(Progress *progress)>  Work;
typedef function<GetResult(git_remote *remote)> RemoteAction;


template<typename T>
struct memfun_type {
    using type = void;
};

template<typename Ret, typename Class, typename... Args>
struct memfun_type<Ret(Class::*)(Args...) const> {
    using type = function<Ret(Args...)>;
};

template<typename F>
typename memfun_type<decltype(&F::operator())>::type
FFL(F const &func) {
    // Function from lambda !
    return func;
}
#endif  // SRC_COMMON_H_
