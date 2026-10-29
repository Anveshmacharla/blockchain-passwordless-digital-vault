import {
  checkAuthenticationThrottle,
  recordFailedAuthenticationAttempt,
  resetAuthenticationAttempts,
} from "./auth-failure.service";

const identifier =
  "threshold-test@example.com";

async function main() {
  resetAuthenticationAttempts(identifier);

  console.log("Initial throttled status:");
  console.log(
    checkAuthenticationThrottle(identifier)
  );

  for (let attempt = 1; attempt <= 5; attempt++) {
    await recordFailedAuthenticationAttempt(
      identifier
    );

    console.log(
      `After failed attempt ${attempt}:`,
      checkAuthenticationThrottle(identifier)
    );
  }

  console.log(
    "Final throttled status:",
    checkAuthenticationThrottle(identifier)
  );

  resetAuthenticationAttempts(identifier);

  console.log(
    "After reset:",
    checkAuthenticationThrottle(identifier)
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});