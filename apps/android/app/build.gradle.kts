plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.prasongme.configuration"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.prasongme.configuration"
        minSdk = 31
        targetSdk = 35
        versionCode = 1
        versionName = "0.1.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
        }
    }
}

kotlin { jvmToolchain(17) }
