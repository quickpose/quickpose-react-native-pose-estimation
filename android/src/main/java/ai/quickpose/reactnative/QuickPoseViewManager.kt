package ai.quickpose.reactnative

import ai.quickpose.camera.QuickPoseCameraSwitchView
import ai.quickpose.core.*
import android.Manifest
import android.graphics.Color
import org.json.JSONObject
import android.content.pm.PackageManager
import android.view.Choreographer
import android.view.View
import android.widget.FrameLayout
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
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
    private var featureMaps: List<ReadableMap> = emptyList()
    private var useFrontCamera: Boolean = true
    private var hasStarted = false
    private var currentFeatures: List<Pair<String, Feature>> = emptyList()

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
        featureMaps = if (features != null) (0 until features.size()).mapNotNull { features.getMap(it) } else emptyList()
        if (hasStarted) {
            val keyed = mapFeatures()
            if (keyed.isNotEmpty()) {
                currentFeatures = keyed
                quickPose?.update(keyed.map { it.second }.toTypedArray())
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
        if (sdkKey.isEmpty() || featureMaps.isEmpty() || hasStarted) return

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

        // Pass AT_MOST to both axes so QuickPoseCameraView.onMeasure() can
        // pick its own cover-fit size (it returns >= parent on whichever
        // axis needs cropping). Then lay the child out at its chosen size,
        // centred — the parent FrameLayout clips the overflow.
        for (i in 0 until view.childCount) {
            val child = view.getChildAt(i)
            child.measure(
                View.MeasureSpec.makeMeasureSpec(width, View.MeasureSpec.AT_MOST),
                View.MeasureSpec.makeMeasureSpec(height, View.MeasureSpec.AT_MOST)
            )
            val childWidth = child.measuredWidth.coerceAtLeast(width)
            val childHeight = child.measuredHeight.coerceAtLeast(height)
            val left = (width - childWidth) / 2
            val top = (height - childHeight) / 2
            child.layout(left, top, left + childWidth, top + childHeight)
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
                FrameLayout.LayoutParams.WRAP_CONTENT,
                android.view.Gravity.CENTER
            )
        )

        val keyed = mapFeatures()
        if (keyed.isEmpty()) return
        currentFeatureKeys = keyed.map { it.first }
        val features = keyed.map { it.second }.toTypedArray()

        val lifecycleOwner = activity as? androidx.lifecycle.LifecycleOwner ?: return
        lifecycleOwner.lifecycleScope.launch {
            csvView.start(useFrontCamera)
            qp.start(
                features,
                onFrame = { status, _, featureResults, feedback, _ ->
                    if (status is Status.Success) {
                        val resultsJson = JSONObject()
                        val feedbacksJson = JSONObject()
                        for ((featureKey, feature) in currentFeatures) {
                            featureResults[feature]?.let { result ->
                                resultsJson.put(featureKey, result.value.toDouble())
                            }
                            val fb = feedback?.get(feature)?.displayString
                            if (!fb.isNullOrEmpty()) {
                                feedbacksJson.put(featureKey, fb)
                            }
                        }
                        val event = Arguments.createMap().apply {
                            putString("resultsJson", resultsJson.toString())
                            putString("feedbacksJson", feedbacksJson.toString())
                            putInt("fps", status.fps)
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

    // MARK: - Feature dict → SDK Feature mapping

    private fun mapFeatures(): List<Pair<String, Feature>> {
        return featureMaps.mapNotNull { map ->
            val key = map.str("featureKey") ?: return@mapNotNull null
            val feature = mapFeature(map) ?: return@mapNotNull null
            Pair(key, feature)
        }
    }

    private fun mapFeature(map: ReadableMap): Feature? {
        val type = map.str("type") ?: return null
        val style = map.map("style")?.let { parseStyleFromMap(it) } ?: Style()

        return when (type) {
            "overlay" -> {
                val group = groupForName(map.str("group"), sideForName(map.str("side")))
                    ?: return null
                Feature.Overlay(group, style)
            }
            "showPoints" -> Feature.ShowPoints(style)
            "rangeOfMotion" -> romForMap(map)?.let { Feature.RangeOfMotion(it, style) }
            "fitness" -> fitnessForMap(map)?.let { Feature.Fitness(it, style) }
            "inside" -> {
                val group = groupForName(map.str("group"), null) ?: Landmarks.Group.WholeBodyAndHead()
                val insets = insetsForMap(map.map("edgeInsets"))
                Feature.Inside(insets, group, style)
            }
            else -> null
        }
    }

    // MARK: - Identifier → SDK enum lookups

    private fun sideForName(name: String?): Side? {
        return when (name) {
            "left" -> Side.LEFT
            "right" -> Side.RIGHT
            else -> null
        }
    }

    private fun groupForName(name: String?, side: Side?): Landmarks.Group? {
        return when (name) {
            "wholeBody" -> Landmarks.Group.WholeBody()
            "wholeBodyAndHead" -> Landmarks.Group.WholeBodyAndHead()
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
            "head" -> Landmarks.Group.Head()
            else -> null
        }
    }

    private fun romForMap(map: ReadableMap): RangeOfMotion? {
        val joint = map.str("joint") ?: return null
        val clockwise = map.bool("clockwise")
        val side = sideForName(map.str("side"))

        return when (joint) {
            "neck" -> RangeOfMotion.Neck(clockwise)
            "shoulder" -> RangeOfMotion.Shoulder(side ?: Side.LEFT, clockwise)
            "elbow" -> RangeOfMotion.Elbow(side ?: Side.LEFT, clockwise)
            "hip" -> RangeOfMotion.Hip(side ?: Side.LEFT, clockwise)
            "back" -> RangeOfMotion.Back(clockwise)
            "knee" -> RangeOfMotion.Knee(side ?: Side.LEFT, clockwise)
            "ankle" -> RangeOfMotion.Ankle(side ?: Side.LEFT, clockwise)
            else -> null
        }
    }

    private fun fitnessForMap(map: ReadableMap): FitnessFeature? {
        val exercise = map.str("exercise") ?: return null
        val side = sideForName(map.str("side"))

        return when (exercise) {
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

    private fun insetsForMap(map: ReadableMap?): RelativeEdgeInsets {
        if (map == null) return RelativeEdgeInsets(0.1f, 0.1f, 0.1f, 0.1f)
        return RelativeEdgeInsets(
            map.dbl("top", 0.1).toFloat(),
            map.dbl("left", 0.1).toFloat(),
            map.dbl("bottom", 0.1).toFloat(),
            map.dbl("right", 0.1).toFloat()
        )
    }

    // MARK: - Style parsing

    private fun parseStyleFromMap(map: ReadableMap): Style {
        val color = map.str("color")?.let {
            try { Color.valueOf(Color.parseColor(it)) } catch (e: Exception) { null }
        } ?: Color.valueOf(Color.WHITE)

        val relativeFontSize = map.dbl("relativeFontSize", 1.0).toFloat()
        val relativeArcSize = map.dbl("relativeArcSize", 1.0).toFloat()
        val relativeLineWidth = map.dbl("relativeLineWidth", 1.0).toFloat()
        val cornerRadius = map.dbl("cornerRadius", 0.0).toFloat()

        val conditionalColors = map.array("conditionalColors")?.let { arr ->
            (0 until arr.size()).mapNotNull { i ->
                val cc = arr.getMap(i) ?: return@mapNotNull null
                val ccColor = cc.str("color")?.let {
                    try { Color.valueOf(Color.parseColor(it)) } catch (e: Exception) { null }
                } ?: return@mapNotNull null
                val min = if (cc.hasKey("min") && !cc.isNull("min")) cc.getDouble("min").toFloat() else null
                val max = if (cc.hasKey("max") && !cc.isNull("max")) cc.getDouble("max").toFloat() else null
                Style.ConditionalColor(min, max, ccColor)
            }
        }

        return Style(
            relativeFontSize = relativeFontSize,
            relativeArcSize = relativeArcSize,
            relativeLineWidth = relativeLineWidth,
            color = color,
            cornerRadius = cornerRadius,
            conditionalColors = conditionalColors
        )
    }

    // MARK: - ReadableMap convenience

    private fun ReadableMap.str(key: String): String? =
        if (hasKey(key) && !isNull(key)) getString(key) else null

    private fun ReadableMap.dbl(key: String, default: Double): Double =
        if (hasKey(key) && !isNull(key)) getDouble(key) else default

    private fun ReadableMap.bool(key: String): Boolean =
        hasKey(key) && !isNull(key) && getBoolean(key)

    private fun ReadableMap.map(key: String): ReadableMap? =
        if (hasKey(key) && !isNull(key)) getMap(key) else null

    private fun ReadableMap.array(key: String): ReadableArray? =
        if (hasKey(key) && !isNull(key)) getArray(key) else null
}
