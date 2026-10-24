package service;

import model.Donor;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

/**
 * Encapsulates all eligibility rules for blood donation.
 * Member 1 – Backend & OOP Architect
 *
 * Rules:
 *  1. Donor must be between 18 and 65 years old.
 *  2. Minimum 90 days (≈ 3 months) must have passed since the last donation.
 */
public class EligibilityService {

    private static final int MIN_AGE          = 18;
    private static final int MAX_AGE          = 65;
    private static final int MIN_GAP_DAYS     = 90;  // minimum gap between donations

    /**
     * Result object returned by the eligibility check.
     */
    public static class EligibilityResult {
        public final boolean eligible;
        public final String message;

        public EligibilityResult(boolean eligible, String message) {
            this.eligible = eligible;
            this.message  = message;
        }

        public String toJson() {
            return String.format("{\"eligible\":%b,\"message\":\"%s\"}", eligible, message);
        }
    }

    /**
     * Checks whether a donor is eligible to donate today.
     *
     * @param donor The donor to evaluate.
     * @return An EligibilityResult with a human-readable message.
     */
    public EligibilityResult checkEligibility(Donor donor) {
        // Age check
        if (donor.getAge() < MIN_AGE) {
            return new EligibilityResult(false,
                "Donor is under the minimum age of " + MIN_AGE + " years.");
        }
        if (donor.getAge() > MAX_AGE) {
            return new EligibilityResult(false,
                "Donor exceeds the maximum age of " + MAX_AGE + " years.");
        }

        // Gap check (skip if donor has never donated before)
        if (donor.getLastDonationDate() != null) {
            long daysSinceLast = ChronoUnit.DAYS.between(donor.getLastDonationDate(), LocalDate.now());
            if (daysSinceLast < MIN_GAP_DAYS) {
                long daysRemaining = MIN_GAP_DAYS - daysSinceLast;
                return new EligibilityResult(false,
                    "Must wait " + daysRemaining + " more day(s) before next donation " +
                    "(minimum gap: " + MIN_GAP_DAYS + " days).");
            }
        }

        return new EligibilityResult(true, "Donor is eligible to donate.");
    }
}
