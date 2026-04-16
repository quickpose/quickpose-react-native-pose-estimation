package ai.quickpose.reactnative

import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Matrix
import android.os.Handler
import android.os.HandlerThread
import android.view.PixelCopy
import android.view.Surface
import android.view.SurfaceView
import android.view.View
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

    @ReactMethod
    fun captureFrame(viewTag: Int, promise: Promise) {
        captureToFile(viewTag) { result ->
            result.fold(
                onSuccess = { file -> promise.resolve("file://${file.absolutePath}") },
                onFailure = { err -> promise.reject("capture_failed", err) }
            )
        }
    }

    @ReactMethod
    fun shareFrame(viewTag: Int, title: String?, promise: Promise) {
        captureToFile(viewTag) { result ->
            result.fold(
                onSuccess = { file ->
                    try {
                        val ctx = reactApplicationContext
                        val authority = "${ctx.packageName}.quickpose.fileprovider"
                        val uri = FileProvider.getUriForFile(ctx, authority, file)
                        val intent = Intent(Intent.ACTION_SEND).apply {
                            type = "image/png"
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
                        promise.reject("share_failed", e)
                    }
                },
                onFailure = { err -> promise.reject("capture_failed", err) }
            )
        }
    }

    private fun captureToFile(viewTag: Int, onDone: (Result<File>) -> Unit) {
        val ctx = reactApplicationContext
        ctx.runOnUiQueueThread {
            try {
                val view = UIManagerHelper.getUIManager(ctx, viewTag)?.resolveView(viewTag)
                    ?: return@runOnUiQueueThread onDone(Result.failure(IllegalStateException("Could not resolve view $viewTag")))
                val surfaceView = findSurfaceView(view)
                    ?: return@runOnUiQueueThread onDone(Result.failure(IllegalStateException("No SurfaceView under QuickPoseView")))
                // The camera preview writes to the SurfaceView's Surface at its
                // native sensor resolution — always landscape (e.g. 1920x1080),
                // regardless of device orientation. All QuickPose-drawn overlays
                // (skeleton, inside box) are composited onto that same Surface,
                // so a single PixelCopy captures everything the user sees.
                //
                // To avoid the stretch bug from 0.3.4/0.3.5, force the dest bitmap
                // to landscape aspect (max x min of whatever surfaceFrame reports)
                // so PixelCopy does a 1:1 copy of the landscape producer buffer.
                // Then rotate the result to match the display orientation.
                val sf = surfaceView.holder.surfaceFrame
                val rawW = sf.width().takeIf { it > 0 } ?: surfaceView.width
                val rawH = sf.height().takeIf { it > 0 } ?: surfaceView.height
                if (rawW == 0 || rawH == 0) {
                    return@runOnUiQueueThread onDone(Result.failure(IllegalStateException("Surface has zero size")))
                }
                val landscapeW = maxOf(rawW, rawH)
                val landscapeH = minOf(rawW, rawH)
                val rotationDegrees = when (surfaceView.display?.rotation ?: Surface.ROTATION_0) {
                    Surface.ROTATION_0 -> 90
                    Surface.ROTATION_90 -> 0
                    Surface.ROTATION_180 -> 270
                    Surface.ROTATION_270 -> 180
                    else -> 0
                }
                val bitmap = Bitmap.createBitmap(landscapeW, landscapeH, Bitmap.Config.ARGB_8888)
                val thread = HandlerThread("QuickPoseCapture")
                thread.start()
                val handler = Handler(thread.looper)
                PixelCopy.request(surfaceView, bitmap, { copyResult ->
                    try {
                        if (copyResult != PixelCopy.SUCCESS) {
                            onDone(Result.failure(IllegalStateException("PixelCopy failed with $copyResult")))
                            return@request
                        }
                        val output = if (rotationDegrees != 0) {
                            val matrix = Matrix().apply { postRotate(rotationDegrees.toFloat()) }
                            Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true)
                        } else {
                            bitmap
                        }
                        val file = File(ctx.cacheDir, "quickpose_${System.currentTimeMillis()}.png")
                        FileOutputStream(file).use { out ->
                            output.compress(Bitmap.CompressFormat.PNG, 100, out)
                        }
                        if (output !== bitmap) output.recycle()
                        onDone(Result.success(file))
                    } catch (e: Exception) {
                        onDone(Result.failure(e))
                    } finally {
                        bitmap.recycle()
                        thread.quitSafely()
                    }
                }, handler)
            } catch (e: Exception) {
                onDone(Result.failure(e))
            }
        }
    }

    private fun findSurfaceView(root: View): SurfaceView? {
        if (root is SurfaceView) return root
        if (root is ViewGroup) {
            for (i in 0 until root.childCount) {
                val hit = findSurfaceView(root.getChildAt(i))
                if (hit != null) return hit
            }
        }
        return null
    }
}
