package com.mopc.core;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.util.Log;
import androidx.core.app.NotificationCompat;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

/**
 * Servicio que maneja notificaciones push de Firebase Cloud Messaging.
 * Se activa cuando la app está en segundo plano o cerrada.
 */
public class MyFirebaseMessagingService extends FirebaseMessagingService {
    
    private static final String TAG = "FCMService";
    private static final String CHANNEL_ID = "chat_messages";
    private static final String CHANNEL_NAME = "Mensajes de Chat";

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
    }

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        Log.d(TAG, "📨 Mensaje FCM recibido desde: " + remoteMessage.getFrom());

        // Verificar si tiene notificación
        if (remoteMessage.getNotification() != null) {
            String title = remoteMessage.getNotification().getTitle();
            String body = remoteMessage.getNotification().getBody();
            Log.d(TAG, "🔔 Notificación: " + title + " - " + body);
            
            showNotification(title, body);
        } else if (remoteMessage.getData().size() > 0) {
            // Si solo tiene datos pero no notificación, crear una notificación manual
            Log.d(TAG, "📦 Solo datos recibidos: " + remoteMessage.getData());
            String title = remoteMessage.getData().get("title");
            String body = remoteMessage.getData().get("body");
            if (title != null) {
                showNotification(title, body);
            }
        }
    }

    @Override
    public void onNewToken(String token) {
        Log.d(TAG, "🔑 Nuevo token FCM: " + token.substring(0, 20) + "...");
        // El token se guardará automáticamente por fcmService.ts
    }

    /**
     * Crea el canal de notificaciones para Android 8.0+
     */
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            // Configurar sonido de notificación
            Uri soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .setUsage(AudioAttributes.USAGE_NOTIFICATION_COMMUNICATION_INSTANT)
                .build();
            
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            );
            
            channel.setDescription("Notificaciones de mensajes de chat en tiempo real");
            channel.enableLights(true);
            channel.enableVibration(true);
            channel.setShowBadge(true);
            channel.setSound(soundUri, audioAttributes);
            // IMPORTANCE_HIGH es crucial para Samsung/Xiaomi/MIUI
            channel.setImportance(NotificationManager.IMPORTANCE_HIGH);
            channel.setBypassDnd(false); // No molestar
            channel.setLockscreenVisibility(NotificationCompat.VISIBILITY_PUBLIC);
            
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
                Log.d(TAG, "✅ Canal de notificaciones creado: " + CHANNEL_ID);
            } else {
                Log.e(TAG, "❌ NotificationManager es null");
            }
        }
    }

    /**
     * Muestra una notificación en la barra de estado del sistema
     */
    private void showNotification(String title, String body) {
        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this, 
            0, 
            intent,
            PendingIntent.FLAG_ONE_SHOT | PendingIntent.FLAG_IMMUTABLE
        );

        // Usar sonido predeterminado del sistema
        Uri defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(title != null ? title : "Nuevo mensaje")
            .setContentText(body != null ? body : "")
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_MAX) // PRIORITY_MAX para Xiaomi
            .setDefaults(NotificationCompat.DEFAULT_ALL)
            .setSound(defaultSoundUri)
            .setVibrate(new long[]{0, 500, 250, 500}) // Patrón de vibración
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setContentIntent(pendingIntent)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(body)); // Mostrar texto completo

        NotificationManager manager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (manager != null) {
            // Usar timestamp como ID para permitir múltiples notificaciones
            int notificationId = (int) System.currentTimeMillis();
            manager.notify(notificationId, builder.build());
            Log.d(TAG, "✅ Notificación mostrada en sistema - ID: " + notificationId);
        } else {
            Log.e(TAG, "❌ NotificationManager es null, no se pudo mostrar la notificación");
        }
    }
}
