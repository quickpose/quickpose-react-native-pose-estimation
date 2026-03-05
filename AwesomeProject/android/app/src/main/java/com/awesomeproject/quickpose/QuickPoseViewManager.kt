package com.awesomeproject.quickpose

import ai.quickpose.camera.QuickPoseCameraSwitchView
import ai.quickpose.core.*
import android.Manifest
import android.content.pm.PackageManager
import android.view.Choreographer
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.facebook.react.bridge.Arguments
import com.facebook.react.common.MapBuilder
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.events.RCTEventEmitter
import kotlinx.coroutines.launch

class QuickPoseViewManager : SimpleViewManager<FrameLayout>() {

    companion object {
        private const val REACT_CLASS = "QuickPoseView"
        private const val CAMERA_PERMISSION_REQUEST_CODE = 1001
    }

    private var quickPose: QuickPose? = null
    private var cameraSwitchView: QuickPoseCameraSwitchView? = null

    override fun getName(): String = REACT_CLASS

    override fun createViewInstance(reactContext: ThemedReactContext): FrameLayout {
        val container = FrameLayout(reactContext)

        val activity = reactContext.currentActivity
            ?: return container

        if (ContextCompat.checkSelfPermission(activity, Manifest.permission.CAMERA)
            != PackageManager.PERMISSION_GRANTED
        ) {
            ActivityCompat.requestPermissions(
                activity,
                arrayOf(Manifest.permission.CAMERA),
                CAMERA_PERMISSION_REQUEST_CODE
            )
        }

        return container
    }

    override fun onDropViewInstance(view: FrameLayout) {
        quickPose?.stop()
        cameraSwitchView?.stop()
        quickPose = null
        cameraSwitchView = null
        super.onDropViewInstance(view)
    }

    override fun addEventEmitters(reactContext: ThemedReactContext, view: FrameLayout) {
        super.addEventEmitters(reactContext, view)

        view.addOnAttachStateChangeListener(object : View.OnAttachStateChangeListener {
            override fun onViewAttachedToWindow(v: View) {
                startCamera(reactContext, view)
                setupLayoutHack(view)
            }

            override fun onViewDetachedFromWindow(v: View) {
                quickPose?.stop()
                cameraSwitchView?.stop()
            }
        })
    }

    /**
     * React Native uses Yoga for layout and doesn't trigger standard Android
     * measure/layout passes for natively-added children. We use Choreographer
     * to force layout on every frame so the camera SurfaceView renders properly.
     */
    private fun setupLayoutHack(view: FrameLayout) {
        val frameCallback = object : Choreographer.FrameCallback {
            override fun doFrame(frameTimeNanos: Long) {
                manuallyLayoutChildren(view)
                view.viewTreeObserver.dispatchOnGlobalLayout()
                if (view.isAttachedToWindow) {
                    Choreographer.getInstance().postFrameCallback(this)
                }
            }
        }
        Choreographer.getInstance().postFrameCallback(frameCallback)
    }

    private fun manuallyLayoutChildren(view: FrameLayout) {
        val width = view.width
        val height = view.height
        if (width == 0 || height == 0) return

        for (i in 0 until view.childCount) {
            val child = view.getChildAt(i)
            child.measure(
                View.MeasureSpec.makeMeasureSpec(width, View.MeasureSpec.EXACTLY),
                View.MeasureSpec.makeMeasureSpec(height, View.MeasureSpec.EXACTLY)
            )
            child.layout(0, 0, width, height)
        }
    }

    private fun startCamera(reactContext: ThemedReactContext, container: FrameLayout) {
        val activity = reactContext.currentActivity ?: return

        if (ContextCompat.checkSelfPermission(activity, Manifest.permission.CAMERA)
            != PackageManager.PERMISSION_GRANTED
        ) {
            return
        }

        val qp = QuickPose(activity, sdkKey = "YOUR SDK KEY HERE")
        quickPose = qp

        val csvView = QuickPoseCameraSwitchView(activity, qp)
        cameraSwitchView = csvView

        container.addView(
            csvView,
            FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
        )

        val lifecycleOwner = activity as? androidx.lifecycle.LifecycleOwner ?: return
        lifecycleOwner.lifecycleScope.launch {
            csvView.start(true)
            qp.start(
                arrayOf(Feature.RangeOfMotion(RangeOfMotion.Shoulder(Side.LEFT, false))),
                onFrame = { status, _, features, _, _ ->
                    if (status is Status.Success) {
                        val angle = features.values.firstOrNull()?.value?.toDouble() ?: 0.0
                        val event = Arguments.createMap().apply {
                            putDouble("angle", angle)
                        }
                        reactContext
                            .getJSModule(RCTEventEmitter::class.java)
                            .receiveEvent(container.id, "topUpdate", event)
                    }
                }
            )
        }
    }

    override fun getExportedCustomDirectEventTypeConstants(): Map<String, Any>? {
        return MapBuilder.builder<String, Any>()
            .put("topUpdate", MapBuilder.of("registrationName", "onUpdate"))
            .build()
    }
}
