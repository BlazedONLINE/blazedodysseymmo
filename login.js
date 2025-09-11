<form id="loginForm" novalidate>
  <div class="form-field">
    <label for="loginEmail">Email</label>
    <input
      id="loginEmail"
      name="email"
      type="email"
      inputmode="email"
      autocomplete="email"
      required
      placeholder="you@example.com"
    />
  </div>

  <div class="form-field">
    <label for="loginPassword">Password</label>
    <input
      id="loginPassword"
      name="password"
      type="password"
      autocomplete="current-password"
      required
      placeholder="••••••"
    />
  </div>

  <div class="error" id="loginError" aria-live="polite"></div>

  <button id="loginBtn" type="submit">Log In</button>
</form>
