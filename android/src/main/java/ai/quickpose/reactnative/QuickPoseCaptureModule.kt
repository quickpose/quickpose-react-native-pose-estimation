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
                // Size the destination bitmap to the Surface's native buffer, NOT
                // the view bounds. The camera preview renders at its own resolution
                // (often landscape 720p/1080p) into a SurfaceView stretched to fit
                // the screen. Sizing the bitmap to view dimensions leaves the
                // area outside the buffer rect unfilled — which stays transparent
                // on ARGB_8888 — producing a cropped-top composite.
                val surfaceRect = surfaceView.holder.surfaceFrame
                val width = surfaceRect.width().takeIf { it > 0 } ?: surfaceView.width
                val height = surfaceRect.height().takeIf { it > 0 } ?: surfaceView.height
                if (width == 0 || height == 0) {
                    return@runOnUiQueueThread onDone(Result.failure(IllegalStateException("Surface has zero size")))
                }
                val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
                val thread = HandlerThread("QuickPoseCapture")
                thread.start()
                val handler = Handler(thread.looper)
                // Camera sensor buffer is always in its native orientation
                // (typically landscape). The screen preview is rotated by the
                // compositor based on the window rotation, but PixelCopy reads
                // the raw surface buffer — so we apply the matching rotation
                // here to match what the user sees on screen.
                val rotationDegrees = when (surfaceView.display?.rotation ?: Surface.ROTATION_0) {
                    Surface.ROTATION_0 -> 90
                    Surface.ROTATION_90 -> 0
                    Surface.ROTATION_180 -> 270
                    Surface.ROTATION_270 -> 180
                    else -> 0
                }
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
