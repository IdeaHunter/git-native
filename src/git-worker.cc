#include "./git-worker.h"

GitWorker::GitWorker(
    ToResult<void> createResult,
    Work<void> work,
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


GitWorker::~GitWorker() { }


void GitWorker::Execute() {
    _isOk =_work(static_cast<void**>(&_val));
}

NAN_METHOD(DirtyHackToKickEventQueue) {}
static Nan::Callback* tickKicker =
    new Nan::Callback(
        Nan::New<v8::FunctionTemplate>(DirtyHackToKickEventQueue)
            ->GetFunction());


void GitWorker::HandleOKCallback() {
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
