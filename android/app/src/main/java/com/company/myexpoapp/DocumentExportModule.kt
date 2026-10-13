package com.company.myexpoapp

import android.content.ContentValues
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import android.util.Base64
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.File
import java.io.FileOutputStream
import java.io.IOException

class DocumentExportModule(
  reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "DocumentExportModule"

  @ReactMethod
  fun saveFile(base64: String, filename: String, mimeType: String, promise: Promise) {
    var insertedUri: Uri? = null

    try {
      val bytes = Base64.decode(base64, Base64.DEFAULT)

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        val resolver = reactApplicationContext.contentResolver
        val values = ContentValues().apply {
          put(MediaStore.MediaColumns.DISPLAY_NAME, filename)
          put(MediaStore.MediaColumns.MIME_TYPE, mimeType)
          put(
            MediaStore.MediaColumns.RELATIVE_PATH,
            Environment.DIRECTORY_DOWNLOADS + "/Hadi factor"
          )
          put(MediaStore.MediaColumns.IS_PENDING, 1)
        }

        val collection = MediaStore.Downloads.EXTERNAL_CONTENT_URI
        insertedUri = resolver.insert(collection, values)
          ?: throw IOException("ساخت فایل در حافظه عمومی انجام نشد.")

        resolver.openOutputStream(insertedUri!!, "w")?.use { output ->
          output.write(bytes)
        } ?: throw IOException("باز کردن فایل برای نوشتن انجام نشد.")

        val completedValues = ContentValues().apply {
          put(MediaStore.MediaColumns.IS_PENDING, 0)
        }
        resolver.update(insertedUri!!, completedValues, null, null)
        promise.resolve(insertedUri.toString())
      } else {
        val downloads = Environment.getExternalStoragePublicDirectory(
          Environment.DIRECTORY_DOWNLOADS
        )
        val folder = File(downloads, "Hadi factor")
        if (!folder.exists() && !folder.mkdirs()) {
          throw IOException("ساخت پوشه Hadi factor انجام نشد.")
        }

        val destination = File(folder, filename)
        FileOutputStream(destination).use { output ->
          output.write(bytes)
        }
        promise.resolve(Uri.fromFile(destination).toString())
      }
    } catch (error: Exception) {
      insertedUri?.let { uri ->
        try {
          reactApplicationContext.contentResolver.delete(uri, null, null)
        } catch (_: Exception) {
        }
      }
      promise.reject("DOCUMENT_EXPORT_FAILED", error.message, error)
    }
  }
}
