package cl.beautyhogar.app;

import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        configureWindowBeforeCreate();
        super.onCreate(savedInstanceState);
        applyFullscreenAndSafeInsets();
    }

    @Override
    public void onResume() {
        super.onResume();
        hideStatusBar();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            hideStatusBar();
        }
    }

    private void configureWindowBeforeCreate() {
        Window window = getWindow();
        if (window == null) return;

        window.addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            WindowManager.LayoutParams lp = window.getAttributes();
            lp.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_NEVER;
            window.setAttributes(lp);
        }
    }

    private void applyFullscreenAndSafeInsets() {
        Window window = getWindow();
        if (window != null) {
            WindowCompat.setDecorFitsSystemWindows(window, true);
            window.getDecorView().post(this::hideStatusBar);
        }

        hideStatusBar();

        View contentView = findViewById(android.R.id.content);
        if (contentView != null) {
            ViewCompat.setOnApplyWindowInsetsListener(contentView, (view, windowInsets) -> {
                Insets insets = windowInsets.getInsets(
                    WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout()
                );
                view.setPadding(insets.left, insets.top, insets.right, insets.bottom);
                return WindowInsetsCompat.CONSUMED;
            });
        }
    }

    private void hideStatusBar() {
        Window window = getWindow();
        if (window == null) return;

        window.addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);

        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(window, window.getDecorView());
        if (controller != null) {
            controller.setSystemBarsBehavior(
                WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            );
            controller.hide(WindowInsetsCompat.Type.statusBars());
        }
    }
}
