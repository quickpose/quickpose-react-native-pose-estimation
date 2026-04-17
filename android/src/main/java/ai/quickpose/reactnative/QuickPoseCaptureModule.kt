package ai.quickpose.reactnative

import ai.quickpose.camera.QuickPoseCameraSwitchView
import ai.quickpose.core.QuickPose
import android.content.Intent
import android.view.SurfaceView
import android.view.View
import androidx.core.content.FileProvider
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.uimanager.UIManagerHelper
import java.io.File
import java.io.FileOutputStream

class QuickPoseCaptureModule(context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {

    companion object {
        const val TAG_OVERLAY_SURFACE = 0x7f010001
        const val TAG_CAMERA_SWITCH_VIEW = 0x7f010002
    }

    override fun getName(): String = "QuickPoseCaptureModule"

    @ReactMethod
    fun captureFrame(viewTag: Int, promise: Promise) {
        val ctx = reactApplicationContext
        ctx.runOnUiQueueThread {
            try {
                val view = UIManagerHelper.getUIManager(ctx, viewTag)?.resolveView(viewTag)
                    ?: return@runOnUiQueueThread promise.reject("capture_failed", "Could not resolve view")
                val overlay = view.getTag(TAG_OVERLAY_SURFACE) as? SurfaceView
                val csv = view.getTag(TAG_CAMERA_SWITCH_VIEW) as? QuickPoseCameraSwitchView
                    ?: return@runOnUiQueueThread promise.reject("capture_failed", "Camera not ready")

                // Find active camera SurfaceView (first visible non-overlay child)
                var cameraSV: SurfaceView? = null
                for (i in 0 until csv.childCount) {
                    val child = csv.getChildAt(i)
                    if (child is SurfaceView && child.visibility == View.VISIBLE && child !== overlay) {
                        cameraSV = child; break
                    }
                }
                if (cameraSV == null) {
                    return@runOnUiQueueThread promise.reject("capture_failed", "Camera SurfaceView not found")
                }

                QuickPose.captureFrame(cameraSV, overlay) { bitmap ->
                    if (bitmap == null) {
                        promise.reject("capture_failed", "PixelCopy failed")
                        return@captureFrame
                    }
                    try {
                        val file = File(ctx.cacheDir, "quickpose_${System.currentTimeMillis()}.jpg")
                        FileOutputStream(file).use { out ->
                            bitmap.compress(android.graphics.Bitmap.CompressFormat.JPEG, 95, out)
                        }
                        bitmap.recycle()
                        promise.resolve("file://${file.absolutePath}")
                    } catch (e: Exception) {
                        bitmap.recycle()
                        promise.reject("capture_failed", e)
                    }
                }
            } catch (e: Exception) {
                promise.reject("capture_failed", e)
            }
        }
    }

    @ReactMethod
    fun shareFrame(viewTag: Int, title: String?, promise: Promise) {
        val ctx = reactApplicationContext
        ctx.runOnUiQueueThread {
            try {
                val view = UIManagerHelper.getUIManager(ctx, viewTag)?.resolveView(viewTag)
                    ?: return@runOnUiQueueThread promise.reject("share_failed", "Could not resolve view")
                val overlay = view.getTag(TAG_OVERLAY_SURFACE) as? SurfaceView
                val csv = view.getTag(TAG_CAMERA_SWITCH_VIEW) as? QuickPoseCameraSwitchView
                    ?: return@runOnUiQueueThread promise.reject("share_failed", "Camera not ready")

                var cameraSV: SurfaceView? = null
                for (i in 0 until csv.childCount) {
                    val child = csv.getChildAt(i)
                    if (child is SurfaceView && child.visibility == View.VISIBLE && child !== overlay) {
                        cameraSV = child; break
                    }
                }
                if (cameraSV == null) {
                    return@runOnUiQueueThread promise.reject("share_failed", "Camera SurfaceView not found")
                }

                QuickPose.captureFrame(cameraSV, overlay) { bitmap ->
                    if (bitmap == null) {
                        promise.reject("share_failed", "PixelCopy failed")
                        return@captureFrame
                    }
                    try {
                        val file = File(ctx.cacheDir, "quickpose_${System.currentTimeMillis()}.jpg")
                        FileOutputStream(file).use { out ->
                            bitmap.compress(android.graphics.Bitmap.CompressFormat.JPEG, 95, out)
                        }
                        bitmap.recycle()
                        val authority = "${ctx.packageName}.quickpose.fileprovider"
                        val uri = FileProvider.getUriForFile(ctx, authority, file)
                        val intent = Intent(Intent.ACTION_SEND).apply {
                            type = "image/jpeg"
                            putExtra(Intent.EXTRA_STREAM, uri)
                            if (!title.isNullOrEmpty()) putExtra(Intent.EXTRA_SUBJECT, title)
                            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                        }
                        val chooser = Intent.createChooser(intent, title ?: "Share").apply {
                            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                        }
                        ctx.startActivity(chooser)
                        promise.resolve(null)
                    } catch (e: Exception) {
                        bitmap.recycle()
                        promise.reject("share_failed", e)
                    }
                }
            } catch (e: Exception) {
                promise.reject("share_failed", e)
            }
        }
    }
}
