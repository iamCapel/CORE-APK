package com.mopc.core;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    
    private static final String TAG = "MainActivity";
    private static final String CHANNEL_ID = "chat_messages";
    private static final String CHANNEL_NAME = "Mensajes de Chat";
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        WindowCompat.setDecorFitsSystemWindows(getWindow(), true);
        
        // Crear canal de notificaciones al iniciar la app
        createNotificationChannel();
    }
    
    /**
     * Crea el canal de notificaciones para Android 8.0+
     * Importante: Debe crearse aquí también para garantizar que exista al iniciar la app
     */
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            );
            
            // Configuración del canal
            channel.setDescription("Notificaciones de mensajes de chat en tiempo real");
            channel.enableLights(true);
            channel.enableVibration(true);
            channel.setShowBadge(true);
            channel.setImportance(NotificationManager.IMPORTANCE_HIGH);
            
            // Registrar el canal
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
                Log.d(TAG, "✅ Canal de notificaciones creado: " + CHANNEL_ID);
            } else {
                Log.e(TAG, "❌ NotificationManager es null");
            }
        }
    }
}
