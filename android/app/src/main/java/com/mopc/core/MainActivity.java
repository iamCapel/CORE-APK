package com.mopc.core;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.view.Window;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    
    private static final String TAG = "MainActivity";
    private static final String CHANNEL_ID = "chat_messages";
    private static final String CHANNEL_NAME = "Mensajes de Chat";
    private static final String REMINDER_CHANNEL_ID = "vehicle-reminders";
    private static final String REMINDER_CHANNEL_NAME = "Recordatorios de Vehículos";
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Configurar pantalla completa inmersiva para Xiaomi
        setupFullscreenImmersiveMode();
        
        // Crear canal de notificaciones al iniciar la app
        createNotificationChannel();
    }
    
    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            // Re-aplicar modo inmersivo cuando la ventana recupera el foco
            setupFullscreenImmersiveMode();
        }
    }
    
    /**
     * Configura el modo de pantalla completa inmersiva
     * Oculta la barra de estado y la barra de navegación
     * Optimizado para dispositivos Xiaomi Redmi
     */
    private void setupFullscreenImmersiveMode() {
        Window window = getWindow();
        View decorView = window.getDecorView();
        
        // Habilitar modo edge-to-edge
        WindowCompat.setDecorFitsSystemWindows(window, false);
        
        // Android 11+ (API 30+) - Método moderno
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            WindowInsetsController controller = window.getInsetsController();
            if (controller != null) {
                // Ocultar barra de estado y barra de navegación
                controller.hide(WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars());
                
                // Comportamiento inmersivo sticky (las barras se ocultan automáticamente)
                controller.setSystemBarsBehavior(
                    WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
                );
                
                Log.d(TAG, "✅ Modo inmersivo activado (Android 11+)");
            }
        } 
        // Android 5.0+ (API 21+) - Método legacy para compatibilidad
        else {
            WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(window, decorView);
            if (controller != null) {
                // Ocultar barras del sistema
                controller.hide(WindowInsetsCompat.Type.systemBars());
                controller.setSystemBarsBehavior(
                    WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
                );
            }
            
            // Configuración adicional para pantalla completa
            int flags = View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                    | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                    | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                    | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                    | View.SYSTEM_UI_FLAG_FULLSCREEN
                    | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY;
            
            decorView.setSystemUiVisibility(flags);
            
            Log.d(TAG, "✅ Modo inmersivo activado (Android 5-10)");
        }
        
        // Optimizaciones adicionales para Xiaomi MIUI
        window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
        window.setStatusBarColor(Color.TRANSPARENT);
        window.setNavigationBarColor(Color.TRANSPARENT);
        
        // Soporte para notch/cutout en Xiaomi
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            WindowManager.LayoutParams attributes = window.getAttributes();
            attributes.layoutInDisplayCutoutMode = 
                WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            window.setAttributes(attributes);
            Log.d(TAG, "✅ Soporte para notch/cutout activado");
        }
        
        Log.d(TAG, "🔧 Pantalla completa inmersiva configurada para Xiaomi Redmi");
    }
    
    /**
     * Crea el canal de notificaciones para Android 8.0+
     * Importante: Debe crearse aquí también para garantizar que exista al iniciar la app
     */
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager == null) {
                Log.e(TAG, "❌ NotificationManager es null");
                return;
            }
            
            // Canal para mensajes de chat
            NotificationChannel chatChannel = new NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            );
            chatChannel.setDescription("Notificaciones de mensajes de chat en tiempo real");
            chatChannel.enableLights(true);
            chatChannel.enableVibration(true);
            chatChannel.setShowBadge(true);
            chatChannel.setImportance(NotificationManager.IMPORTANCE_HIGH);
            manager.createNotificationChannel(chatChannel);
            Log.d(TAG, "✅ Canal de notificaciones creado: " + CHANNEL_ID);
            
            // Canal para recordatorios de vehículos
            NotificationChannel reminderChannel = new NotificationChannel(
                REMINDER_CHANNEL_ID,
                REMINDER_CHANNEL_NAME,
                NotificationManager.IMPORTANCE_DEFAULT
            );
            reminderChannel.setDescription("Recordatorios cada 6 horas para reportar vehículos");
            reminderChannel.enableLights(true);
            reminderChannel.enableVibration(true);
            reminderChannel.setShowBadge(true);
            manager.createNotificationChannel(reminderChannel);
            Log.d(TAG, "✅ Canal de notificaciones creado: " + REMINDER_CHANNEL_ID);
        }
    }
}
