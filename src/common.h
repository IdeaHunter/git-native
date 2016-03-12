#ifndef SRC_COMMON_H_
#define SRC_COMMON_H_

#include <git2.h>
#include <nan.h>
#include <string>
#include <functional>
#include <vector>


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
            const Nan::AsyncProgressWorker::ExecutionProgress* notifier);

        ~Progress();

        void Step(const char* name, int stepIdx);
        void Message(const char* message, int len);
        void ProgressChange(int done, int total);
        v8::Local<v8::Value> ToJsProgress(v8::Isolate *isolate);

    private:
        void Update();
};

template<typename T>
using Work = std::function<int(Progress *progress, T *res)>;

template<typename T>
using ToResult = v8::Local<v8::Value> (*)(T* nativeResult);

template<typename T>
using RemoteAction = bool (*)(git_remote *remote, T *result);


#endif  // SRC_COMMON_H_
