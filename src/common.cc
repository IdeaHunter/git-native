#include "./common.h"

Progress::Progress(
    const Nan::AsyncProgressWorker::ExecutionProgress* notifier)
    : nanProgress(notifier) {
        uv_mutex_init(&async_lock);
}

Progress::~Progress() {
    uv_mutex_destroy(&async_lock);
}

void Progress::Step(const char* name, int stepIdx) {
    if (lastStepIdx < stepIdx)
        return;

    lastStepIdx = stepIdx;
    lastStepName = name;
    step++;
    progress = PROGESS_UNKNOWN;
    totalProgress = PROGESS_UNKNOWN;
    Update();
}

void Progress::Message(const char* message, int len) {
    uv_mutex_lock(&async_lock);
    messages.push_back(new std::string(message, len));
    uv_mutex_unlock(&async_lock);

    Update();
}

void Progress::ProgressChange(int done, int total) {
    progress = done;
    totalProgress = total;
    Update();
}

v8::Local<v8::Value> Progress::ToJsProgress(v8::Isolate *isolate) {
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

void Progress::Update() {
    ProgressWrapper wrapper = {this};
    nanProgress->Send(
        reinterpret_cast<const char*>(&wrapper),
        sizeof(ProgressWrapper));
}
