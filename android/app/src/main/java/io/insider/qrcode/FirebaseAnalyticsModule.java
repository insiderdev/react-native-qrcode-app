package io.insider.qrcode;


import android.os.Bundle;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.google.firebase.analytics.FirebaseAnalytics;


public class FirebaseAnalyticsModule extends ReactContextBaseJavaModule {
    private FirebaseAnalytics mFirebaseAnalytics;

    public FirebaseAnalyticsModule(ReactApplicationContext reactContext) {
        super(reactContext);

        mFirebaseAnalytics = FirebaseAnalytics.getInstance(this.getReactApplicationContext());
    }

    @Override
    public String getName() {
        return "FirebaseAnalytics";
    }

    @ReactMethod
    public void logEvent(String eventName, ReadableMap parameters) {
        Bundle params = new Bundle();
        mFirebaseAnalytics.logEvent(eventName, Arguments.toBundle(parameters));
    }
}
