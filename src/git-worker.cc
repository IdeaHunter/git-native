#include "./git-worker.h"

NAN_METHOD(DirtyHackToKickEventQueue) {}

Nan::Callback* tickKicker =
    new Nan::Callback(
        Nan::New<v8::FunctionTemplate>(DirtyHackToKickEventQueue)
            ->GetFunction());
