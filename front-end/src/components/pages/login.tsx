import { h } from "preact";
import "ojs/ojbutton";
import "ojs/ojinputtext";
import "ojs/ojlabel";
import "ojs/ojformlayout";
import { buildAuthUrl } from "../../config/app-config";

export function LoginPage() {

  const startOidcLoginFlow = () => {
    window.location.href = buildAuthUrl('login');
  };

  return (
    <main class="oj-web-applayout-content bg-gray-100" style="display: flex; align-items: center; justify-content: center; min-height: 100vh;">
      <div class="card-clean" style="min-width: 400px; max-width: 500px; border: 3px solid var(--app-color-black); box-shadow: var(--app-shadow-lg);">
        <div style="text-align: center; margin-bottom: var(--app-space-2xl);">
          <h1 class="text-black" style="font-size: 2rem; font-weight: 800; margin-bottom: var(--app-space-sm); letter-spacing: -0.025em;">
            Centralized Logging Platform
          </h1>
          <p class="text-gray-600" style="font-size: 1rem; font-weight: 500;">
            Sign in to access the dashboard
          </p>
        </div>
        <oj-button 
            chroming="callToAction"
            style={{
              justifyAlign: 'center',
              width: '100%'
            }}
            onojAction={startOidcLoginFlow}
          >
            Sign In with Google
          </oj-button>
      </div>
    </main>
  );
}
