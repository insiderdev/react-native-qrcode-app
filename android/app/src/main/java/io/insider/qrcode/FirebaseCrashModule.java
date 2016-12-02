package io.insider.qrcode;

import android.os.Bundle;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.google.firebase.analytics.FirebaseAnalytics;
import com.google.firebase.crash.FirebaseCrash;


public class FirebaseCrashModule extends ReactContextBaseJavaModule {

    private static final String TAG = "QRCODE";

    public FirebaseCrashModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "FirebaseCrash";
    }

    @ReactMethod
    public void log(String eventName) {
        FirebaseCrash.log("Activity created");
    }

    @ReactMethod
    public void report(String event) {
        FirebaseCrash.logcat(Log.ERROR, TAG, "NPE caught");
        FirebaseCrash.report(new Throwable(event));
    }
}
