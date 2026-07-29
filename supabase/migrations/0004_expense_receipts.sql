-- Lets an Operating Expense row keep a reference photo of the receipt/bill
-- it was scanned from, alongside the auto-extracted category/amount.
alter table operating_expenses
  add column receipt_image_path text;
