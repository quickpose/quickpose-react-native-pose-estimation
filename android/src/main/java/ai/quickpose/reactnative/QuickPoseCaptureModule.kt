package ai.quickpose.reactnative

import ai.quickpose.camera.QuickPoseCameraSwitchView
import android.content.Intent
import android.view.ViewGroup
import androidx.core.content.FileProvider
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.uimanager.UIManagerHelper
import java.io.File
import java.io.FileOutputStream

class QuickPoseCaptureModule(context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {

    override fun getName(): String = "QuickPoseCaptureModule"

    private fun resolveSwitchView(viewTag: Int): QuickPoseCameraSwitchView? {
        val ctx = reactApplicationContext
        val container = UIManagerHelper.getUIManager(ctx, viewTag)?.resolveView(viewTag) as? ViewGroup ?: return null
        return container.getChildAt(0) as? QuickPoseCameraSwitchView
    }

    @ReactMethod
    fun captureFrame(viewTag: Int, promise: Promise) {
        val ctx = reactApplicationContext
        ctx.runOnUiQueueThread {
            val csv = resolveSwitchView(viewTag)
                ?: return@runOnUiQueueThread promise.reject("capture_failed", "Camera not ready")
            csv.captureFrame { bitmap ->
                if (bitmap == null) {
                    promise.reject("capture_failed", "PixelCopy failed")
                    return@captureFrame
                }
                try {
                    val file = File(ctx.cacheDir, "quickpose_${System.currentTimeMillis()}.jpg")
                    FileOutputStream(file).use { bitmap.compress(android.graphics.Bitmap.CompressFormat.JPEG, 95, it) }
                    bitmap.recycle()
                    promise.resolve("file://${file.absolutePath}")
                } catch (e: Exception) {
                    bitmap.recycle()
                    promise.reject("capture_failed", e)
                }
            }
        }
    }

    @ReactMethod
    fun shareFrame(viewTag: Int, title: String?, promise: Promise) {
        val ctx = reactApplicationContext
        ctx.runOnUiQueueThread {
            val csv = resolveSwitchView(viewTag)
                ?: return@runOnUiQueueThread promise.reject("share_failed", "Camera not ready")
            csv.captureFrame { bitmap ->
                if (bitmap == null) {
                    promise.reject("share_failed", "PixelCopy failed")
                    return@captureFrame
                }
                try {
                    val file = File(ctx.cacheDir, "quickpose_${System.currentTimeMillis()}.jpg")
                    FileOutputStream(file).use { bitmap.compress(android.graphics.Bitmap.CompressFormat.JPEG, 95, it) }
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
        }
    }
}
