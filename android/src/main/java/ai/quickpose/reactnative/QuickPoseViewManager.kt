package ai.quickpose.reactnative

import ai.quickpose.camera.QuickPoseCameraSwitchView
import ai.quickpose.core.*
import android.Manifest
import org.json.JSONArray
import org.json.JSONObject
import android.content.pm.PackageManager
import android.view.Choreographer
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.common.MapBuilder
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.uimanager.events.RCTEventEmitter
import kotlinx.coroutines.launch

class QuickPoseViewManager : SimpleViewManager<FrameLayout>() {

    companion object {
        private const val REACT_CLASS = "QuickPoseView"
        private const val CAMERA_PERMISSION_REQUEST_CODE = 1001
    }

    private var quickPose: QuickPose? = null
    private var cameraSwitchView: QuickPoseCameraSwitchView? = null

    private var sdkKey: String = ""
    private var featureStrings: List<String> = emptyList()
    private var useFrontCamera: Boolean = true
    private var hasStarted = false

    override fun getName(): String = REACT_CLASS

    override fun createViewInstance(reactContext: ThemedReactContext): FrameLayout {
        val container = FrameLayout(reactContext)

        val activity = reactContext.currentActivity ?: return container

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

    @ReactProp(name = "sdkKey")
    fun setSdkKey(view: FrameLayout, key: String?) {
        sdkKey = key ?: ""
        tryStart(view)
    }

    @ReactProp(name = "features")
    fun setFeatures(view: FrameLayout, features: ReadableArray?) {
        featureStrings = (0 until (features?.size() ?: 0)).mapNotNull { features?.getString(it) }
        if (hasStarted) {
            val parsed = featureStrings.mapNotNull { parseFeature(it) }.toTypedArray()
            if (parsed.isNotEmpty()) {
                quickPose?.update(parsed)
            }
        } else {
            tryStart(view)
        }
    }

    @ReactProp(name = "useFrontCamera", defaultBoolean = true)
    fun setUseFrontCamera(view: FrameLayout, front: Boolean) {
        useFrontCamera = front
        tryStart(view)
    }

    private fun tryStart(view: FrameLayout) {
        if (sdkKey.isEmpty() || featureStrings.isEmpty() || hasStarted) return

        val reactContext = view.context as? ThemedReactContext ?: return

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

        hasStarted = true

        // If already attached, start now
        if (view.isAttachedToWindow) {
            startCamera(reactContext, view)
            setupLayoutHack(view)
        }
    }

    override fun onDropViewInstance(view: FrameLayout) {
        quickPose?.stop()
        cameraSwitchView?.stop()
        quickPose = null
        cameraSwitchView = null
        hasStarted = false
        super.onDropViewInstance(view)
    }

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
                View.MeasureSpec.makeMeasureSpec(height, View.MeasureSpec.AT_MOST)
            )
            val childHeight = child.measuredHeight
            val top = (height - childHeight) / 2
            child.layout(0, top, width, top + childHeight)
        }
    }

    private fun startCamera(reactContext: ThemedReactContext, container: FrameLayout) {
        val activity = reactContext.currentActivity ?: return

        if (ContextCompat.checkSelfPermission(activity, Manifest.permission.CAMERA)
            != PackageManager.PERMISSION_GRANTED
        ) {
            return
        }

        val qp = QuickPose(activity, sdkKey = sdkKey)
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

        val features = featureStrings.mapNotNull { parseFeature(it) }.toTypedArray()
        if (features.isEmpty()) return

        val lifecycleOwner = activity as? androidx.lifecycle.LifecycleOwner ?: return
        lifecycleOwner.lifecycleScope.launch {
            csvView.start(useFrontCamera)
            qp.start(
                features,
                onFrame = { status, _, featureResults, feedback, _ ->
                    if (status is Status.Success) {
                        val jsonArray = JSONArray()
                        for ((i, featureString) in featureStrings.withIndex()) {
                            val entries = featureResults.entries.toList()
                            if (i < entries.size) {
                                val obj = JSONObject()
                                obj.put("feature", featureString)
                                obj.put("value", entries[i].value.value.toDouble())
                                jsonArray.put(obj)
                            }
                        }
                        val feedbackText = feedback?.values?.firstOrNull()?.displayString ?: ""
                        val event = Arguments.createMap().apply {
                            putString("resultsJson", jsonArray.toString())
                            putString("feedback", feedbackText)
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

    // --- Feature string parsing ---

    private fun parseFeature(string: String): Feature? {
        val parts = string.split(".")
        val category = parts.firstOrNull() ?: return null

        return when (category) {
            "overlay" -> parseLandmarksGroup(parts.drop(1))?.let { Feature.Overlay(it) }
            "showPoints" -> Feature.ShowPoints()
            "rangeOfMotion" -> parseRangeOfMotion(parts.drop(1))?.let { Feature.RangeOfMotion(it) }
            "fitness" -> parseFitnessFeature(parts.drop(1))?.let { Feature.Fitness(it) }
            else -> null
        }
    }

    private fun parseLandmarksGroup(parts: List<String>): Landmarks.Group? {
        val name = parts.firstOrNull() ?: return null
        val side = if (parts.size > 1) parseSide(parts[1]) else null

        return when (name) {
            "wholeBody" -> Landmarks.Group.WholeBody()
            "upperBody" -> Landmarks.Group.UpperBody()
            "straightArmsUpperBody" -> Landmarks.Group.StraightArmsUpperBody()
            "toWristsUpperBody" -> Landmarks.Group.ToWristsUpperBody()
            "shoulders" -> Landmarks.Group.Shoulders()
            "arm" -> Landmarks.Group.Arm(side ?: Side.LEFT)
            "armToWrist" -> Landmarks.Group.ArmToWrist(side ?: Side.LEFT)
            "armNoElbow" -> Landmarks.Group.ArmNoElbow(side ?: Side.LEFT)
            "straightArm" -> Landmarks.Group.StraightArm(side ?: Side.LEFT)
            "hand" -> Landmarks.Group.Hand(side ?: Side.LEFT)
            "leg" -> Landmarks.Group.Leg(side ?: Side.LEFT)
            "lowerBody" -> Landmarks.Group.LowerBody()
            "hips" -> Landmarks.Group.Hips()
            "elbows" -> Landmarks.Group.Elbows()
            "knees" -> Landmarks.Group.Knees()
            "legs" -> Landmarks.Group.Legs()
            "arms" -> Landmarks.Group.Arms()
            else -> null
        }
    }

    private fun parseRangeOfMotion(parts: List<String>): RangeOfMotion? {
        val name = parts.firstOrNull() ?: return null
        val side = if (parts.size > 1) parseSide(parts[1]) else null

        return when (name) {
            "neck" -> RangeOfMotion.Neck(false)
            "shoulder" -> RangeOfMotion.Shoulder(side ?: Side.LEFT, false)
            "elbow" -> RangeOfMotion.Elbow(side ?: Side.LEFT, false)
            "hip" -> RangeOfMotion.Hip(side ?: Side.LEFT, false)
            "back" -> RangeOfMotion.Back(false)
            "knee" -> RangeOfMotion.Knee(side ?: Side.LEFT, false)
            "ankle" -> RangeOfMotion.Ankle(side ?: Side.LEFT, false)
            else -> null
        }
    }

    private fun parseFitnessFeature(parts: List<String>): FitnessFeature? {
        val name = parts.firstOrNull() ?: return null
        val side = if (parts.size > 1) parseSide(parts[1]) else null

        return when (name) {
            "squats" -> FitnessFeature.Squats
            "pushUps" -> FitnessFeature.PushUps
            "jumpingJacks" -> FitnessFeature.JumpingJacks
            "sumoSquats" -> FitnessFeature.SumoSquats
            "lunges" -> FitnessFeature.Lunges(side ?: Side.LEFT)
            "sitUps" -> FitnessFeature.SitUps
            "cobraWings" -> FitnessFeature.CobraWings
            "plank" -> FitnessFeature.Plank
            "plankStraightArm" -> FitnessFeature.PlankStraightArm
            "legRaises" -> FitnessFeature.LegRaises
            "gluteBridge" -> FitnessFeature.GluteBridge
            "overheadDumbbellPress" -> FitnessFeature.OverheadDumbbellPress
            "vUps" -> FitnessFeature.VUps
            "lateralRaises" -> FitnessFeature.LateralRaises
            "frontRaises" -> FitnessFeature.FrontRaises
            "hipAbductionStanding" -> FitnessFeature.HipAbductionStanding(side ?: Side.LEFT)
            "sideLunges" -> FitnessFeature.SideLunges(side ?: Side.LEFT)
            "bicepCurls" -> FitnessFeature.BicepCurls
            "bicepCurlsSingleArm" -> FitnessFeature.BicepCurlsSingleArm(side ?: Side.LEFT)
            else -> null
        }
    }

    private fun parseSide(string: String): Side? {
        return when (string) {
            "left" -> Side.LEFT
            "right" -> Side.RIGHT
            else -> null
        }
    }
}
