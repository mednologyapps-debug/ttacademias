-- For an enrollment, reference_id identifies the course in the academy ledger.
ALTER TABLE payments MODIFY purpose ENUM('membership','ranking','enrollment') NOT NULL;
