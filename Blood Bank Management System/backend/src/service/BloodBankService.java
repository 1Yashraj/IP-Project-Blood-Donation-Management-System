package service;

import model.BloodRequest;
import model.BloodStock;
import model.Camp;
import model.DonationRecord;
import model.Donor;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Central service that coordinates donor registrations, blood stock,
 * and blood requests.
 * Member 1 – Backend & OOP Architect
 */
public class BloodBankService {

    private final List<Donor>            donors           = new ArrayList<>();
    private final BloodStock             stock            = new BloodStock();
    private final List<BloodRequest>     requests         = new ArrayList<>();
    private final EligibilityService     eligSvc          = new EligibilityService();
    private final List<DonationRecord>   donationHistory  = new ArrayList<>();
    private final List<Camp>             camps            = new ArrayList<>();

    // ── Seed some demo donors ──────────────────────────────────────────────
    public BloodBankService() {
        donors.add(new Donor("Alice Sharma",  28, "A+",  "9876543210", LocalDate.of(2025, 6, 1)));
        donors.add(new Donor("Bob Mehta",     35, "B+",  "9123456780", null));
        donors.add(new Donor("Carol Nair",    22, "O-",  "9988776655", LocalDate.of(2026, 7, 15)));
        donors.add(new Donor("David Rao",     45, "AB+", "9001122334", LocalDate.of(2025, 12, 20)));
        donors.add(new Donor("Eva Singh",     30, "A-",  "9812345678", null));

        // ── Seed sample donation records (matching seed donors, past dates) ──
        donationHistory.add(new DonationRecord(1, "Alice Sharma",  "A+",  2, LocalDate.of(2025, 6, 1)));
        donationHistory.add(new DonationRecord(3, "Carol Nair",    "O-",  1, LocalDate.of(2026, 7, 15)));
        donationHistory.add(new DonationRecord(4, "David Rao",     "AB+", 3, LocalDate.of(2025, 12, 20)));
        donationHistory.add(new DonationRecord(1, "Alice Sharma",  "A+",  1, LocalDate.of(2025, 1, 10)));

        // ── Seed sample camps ──────────────────────────────────────────────
        camps.add(new Camp("World Blood Donor Day Drive", "City Hospital Auditorium",
                LocalDate.of(2026, 6, 14), "Red Cross Society", Camp.Status.COMPLETED));
        camps.add(new Camp("University Mega Blood Camp", "State University Campus",
                LocalDate.of(2026, 11, 20), "NSS Committee", Camp.Status.UPCOMING));
        camps.add(new Camp("Corporate Blood Drive", "TechPark Convention Center",
                LocalDate.of(2026, 12, 5), "HealthFirst NGO", Camp.Status.UPCOMING));
    }

    // ── Donor operations ───────────────────────────────────────────────────

    /** Register a new donor. Returns the newly created Donor. */
    public Donor registerDonor(String name, int age, String bloodGroup,
                                String phone, String lastDonationDateStr) {
        LocalDate lastDate = (lastDonationDateStr != null && !lastDonationDateStr.isEmpty())
                             ? LocalDate.parse(lastDonationDateStr)
                             : null;
        Donor donor = new Donor(name, age, bloodGroup, phone, lastDate);
        donors.add(donor);
        return donor;
    }

    /** Returns all donors serialised as a JSON array. */
    public String getAllDonorsJson() {
        return donors.stream()
                     .map(Donor::toJson)
                     .collect(Collectors.joining(",", "[", "]"));
    }

    /** Search donors by blood group. */
    public String searchDonorsByBloodGroupJson(String bloodGroup) {
        return donors.stream()
                     .filter(d -> d.getBloodGroup().equalsIgnoreCase(bloodGroup))
                     .map(Donor::toJson)
                     .collect(Collectors.joining(",", "[", "]"));
    }

    // ── Donation flow ─────────────────────────────────────────────────────

    /**
     * Attempt a donation: runs eligibility check; if eligible, updates stock
     * and donor's last-donation date.
     *
     * @return JSON result with eligibility info and (if eligible) updated stock.
     */
    public String processDonation(int donorId, int units) {
        Donor donor = findDonorById(donorId);
        if (donor == null) {
            return "{\"success\":false,\"message\":\"Donor not found.\"}";
        }

        EligibilityService.EligibilityResult result = eligSvc.checkEligibility(donor);
        if (!result.eligible) {
            return String.format("{\"success\":false,\"message\":\"%s\"}", result.message);
        }

        // Update stock and donor record
        stock.addUnits(donor.getBloodGroup(), units);
        donor.setLastDonationDate(LocalDate.now());

        // Track donation in history
        donationHistory.add(new DonationRecord(
            donor.getId(), donor.getName(), donor.getBloodGroup(), units, LocalDate.now()
        ));

        return String.format(
            "{\"success\":true,\"message\":\"Donation recorded. Thank you, %s!\",\"bloodGroup\":\"%s\",\"units\":%d}",
            donor.getName(), donor.getBloodGroup(), units
        );
    }

    // ── Donation history ──────────────────────────────────────────────────

    /** Returns all donation records as a JSON array. */
    public String getAllDonationHistoryJson() {
        return donationHistory.stream()
                              .map(DonationRecord::toJson)
                              .collect(Collectors.joining(",", "[", "]"));
    }

    /** Returns donation records for a specific donor as a JSON array. */
    public String getDonationHistoryByDonorJson(int donorId) {
        return donationHistory.stream()
                              .filter(d -> d.getDonorId() == donorId)
                              .map(DonationRecord::toJson)
                              .collect(Collectors.joining(",", "[", "]"));
    }

    // ── Blood request flow ────────────────────────────────────────────────

    /**
     * Submit a blood request and attempt to fulfil it immediately from stock.
     */
    public String processRequest(String recipientName, String bloodGroup,
                                  int unitsNeeded, String reason) {
        BloodRequest req = new BloodRequest(recipientName, bloodGroup, unitsNeeded, reason);
        requests.add(req);

        boolean fulfilled = stock.removeUnits(bloodGroup, unitsNeeded);
        req.setStatus(fulfilled ? BloodRequest.Status.FULFILLED : BloodRequest.Status.REJECTED);

        String msg = fulfilled
            ? "Request fulfilled. " + unitsNeeded + " unit(s) of " + bloodGroup + " allocated."
            : "Insufficient stock for " + bloodGroup + ". Request logged as pending.";

        return String.format("{\"success\":%b,\"message\":\"%s\",\"request\":%s}",
                             fulfilled, msg, req.toJson());
    }

    // ── Stock ──────────────────────────────────────────────────────────────

    /** Returns blood stock as JSON array. */
    public String getStockJson() { return stock.toJson(); }

    // ── Requests ───────────────────────────────────────────────────────────

    /** Returns all blood requests as JSON array. */
    public String getAllRequestsJson() {
        return requests.stream()
                       .map(BloodRequest::toJson)
                       .collect(Collectors.joining(",", "[", "]"));
    }

    // ── Camp / Event Scheduling ───────────────────────────────────────────

    /** Register a new camp. Returns the newly created Camp as JSON. */
    public String registerCamp(String name, String venue, String dateStr, String organizer) {
        LocalDate date = LocalDate.parse(dateStr);
        Camp camp = new Camp(name, venue, date, organizer, Camp.Status.UPCOMING);
        camps.add(camp);
        return "{\"success\":true,\"camp\":" + camp.toJson() + "}";
    }

    /** Returns all camps as a JSON array. */
    public String getAllCampsJson() {
        return camps.stream()
                    .map(Camp::toJson)
                    .collect(Collectors.joining(",", "[", "]"));
    }

    // ── Eligibility check ─────────────────────────────────────────────────

    /** Checks donor eligibility and returns result as JSON. */
    public String checkDonorEligibilityJson(int donorId) {
        Donor donor = findDonorById(donorId);
        if (donor == null) {
            return "{\"eligible\":false,\"message\":\"Donor not found.\"}";
        }
        EligibilityService.EligibilityResult result = eligSvc.checkEligibility(donor);
        return result.toJson();
    }

    // ── Analytics ─────────────────────────────────────────────────────────

    /**
     * Returns a comprehensive analytics JSON object with counts, stock totals,
     * and per-blood-group breakdowns.
     */
    public String getAnalyticsJson() {
        int totalDonors   = donors.size();
        int totalRequests = requests.size();

        long fulfilledRequests = requests.stream()
                .filter(r -> r.getStatus() == BloodRequest.Status.FULFILLED).count();
        long rejectedRequests = requests.stream()
                .filter(r -> r.getStatus() == BloodRequest.Status.REJECTED).count();

        int totalUnitsInStock = 0;
        for (String bg : BloodStock.BLOOD_GROUPS) {
            totalUnitsInStock += stock.getUnits(bg);
        }

        int totalDonations = donationHistory.size();

        // Donations per blood group
        Map<String, Long> donationsPerGroup = donationHistory.stream()
                .collect(Collectors.groupingBy(DonationRecord::getBloodGroup, Collectors.counting()));
        StringBuilder dpgBuilder = new StringBuilder("[");
        boolean firstDpg = true;
        for (String bg : BloodStock.BLOOD_GROUPS) {
            long count = donationsPerGroup.getOrDefault(bg, 0L);
            if (!firstDpg) dpgBuilder.append(",");
            dpgBuilder.append(String.format("{\"bloodGroup\":\"%s\",\"donations\":%d}", bg, count));
            firstDpg = false;
        }
        dpgBuilder.append("]");

        // Requests per blood group
        Map<String, Long> requestsPerGroup = requests.stream()
                .collect(Collectors.groupingBy(BloodRequest::getBloodGroup, Collectors.counting()));
        StringBuilder rpgBuilder = new StringBuilder("[");
        boolean firstRpg = true;
        for (String bg : BloodStock.BLOOD_GROUPS) {
            long count = requestsPerGroup.getOrDefault(bg, 0L);
            if (!firstRpg) rpgBuilder.append(",");
            rpgBuilder.append(String.format("{\"bloodGroup\":\"%s\",\"requests\":%d}", bg, count));
            firstRpg = false;
        }
        rpgBuilder.append("]");

        return String.format(
            "{\"totalDonors\":%d,\"totalRequests\":%d,\"fulfilledRequests\":%d,\"rejectedRequests\":%d," +
            "\"totalUnitsInStock\":%d,\"totalDonations\":%d,\"donationsPerGroup\":%s,\"requestsPerGroup\":%s}",
            totalDonors, totalRequests, fulfilledRequests, rejectedRequests,
            totalUnitsInStock, totalDonations, dpgBuilder.toString(), rpgBuilder.toString()
        );
    }

    // ── Helper ────────────────────────────────────────────────────────────

    private Donor findDonorById(int id) {
        return donors.stream().filter(d -> d.getId() == id).findFirst().orElse(null);
    }
}
