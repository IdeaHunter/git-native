#include "./git-worker.h"

GitWorker::GitWorker(
    Callback *progress,
    Work work,
    Local<Promise::Resolver> resolver,
    int errClass,
    const char* defaultError) :
        AsyncProgressWorker(progress),
        _progress(progress),
        _work(work),
        _defaultErrClass(errClass),
        _error(defaultError) {
    SaveToPersistent("resolver", resolver);
}

void GitWorker::Execute(
    const AsyncProgressWorker::ExecutionProgress& nanProgress) {
    Progress progress(&nanProgress);
    _val =_work(&progress);
    if (!_val) {
        auto last = giterr_last();
        _error = last ? last->message: _error;
    }
}

void GitWorker::HandleProgressCallback(const char *data, size_t size) {
    if (!data)
        return;
    Nan::HandleScope scope;
    auto progressData = reinterpret_cast<Progress::ProgressWrapper*>(
        const_cast<char*>(data))->progress;

    Local<Value> msgArgs[] = {
        progressData->ToJsProgress(Isolate::GetCurrent())
    };
    _progress->Call(1, msgArgs);
}


void GitWorker::HandleOKCallback() {
    auto resolver = GetFromPersistent("resolver")
        .template As<Promise::Resolver>();
    if (!_val) {;
        resolver->Reject(Nan::New(_error).ToLocalChecked());
    } else {
        resolver->Resolve(_val());
    }
    // HACK: tricking nodejs event queue to process resolved promise
    Isolate::GetCurrent()->RunMicrotasks();
}


void GitWorker::RunAsync(
    const Nan::FunctionCallbackInfo<Value>* info,
    Callback *progress,
    Work work,
    int errClass,
    const char* defaultError) {

    Nan::EscapableHandleScope scope;
    auto resolver = Promise::Resolver::New(info->GetIsolate());
    auto worker = new GitWorker(
        progress,
        work,
        resolver,
        errClass,
        defaultError);
    Nan::AsyncQueueWorker(worker);
    info->GetReturnValue().Set(scope.Escape(resolver->GetPromise()));
}
