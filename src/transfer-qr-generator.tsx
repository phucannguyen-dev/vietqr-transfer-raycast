import { Form, ActionPanel, Action, useNavigation, Icon } from "@raycast/api";
import { useFetch } from "@raycast/utils";
import { useState } from "react";
import { Bank, FormValues } from "./types";
import { QRResult } from "./components/QRResult";

export default function Command() {
  const { push } = useNavigation();
  const { data, isLoading } = useFetch<{ data: Bank[] }>("https://api.vietqr.io/v2/banks");
  const [selectedBankBin, setSelectedBankBin] = useState<string>("");

  const [accountError, setAccountError] = useState<string | undefined>();
  const [amountError, setAmountError] = useState<string | undefined>();

  const handleSubmit = (values: FormValues) => {
    let hasError = false;

    if (!values.account) {
      setAccountError("Account number is required");
      hasError = true;
    }

    if (values.amount && isNaN(Number(values.amount))) {
      setAmountError("Amount must be a valid number");
      hasError = true;
    }

    if (hasError || !selectedBankBin) return;

    const memoEncoded = encodeURIComponent(values.memo || "");
    const qrUrl = `https://img.vietqr.io/image/${selectedBankBin}-${values.account}-${values.template}.png?amount=${values.amount || 0}&addInfo=${memoEncoded}`;

    // Đẩy sang Component đã được tách riêng
    push(<QRResult url={qrUrl} />);
  };

  // Hàm xóa lỗi khi người dùng bắt đầu nhập liệu
  function dropAccountErrorIfNeeded() {
    if (accountError && accountError.length > 0) {
      setAccountError(undefined);
    }
  }

  return (
    <Form
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm icon={Icon.Link} title="Generate QR Code" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.Dropdown id="bank" title="Bank" onChange={(value) => setSelectedBankBin(value)}>
        {data?.data.map((b) => (
          <Form.Dropdown.Item key={b.bin} value={b.bin} title={b.shortName} />
        ))}
      </Form.Dropdown>

      <Form.TextField
        id="account"
        title="Account Number"
        placeholder="Enter account number"
        error={accountError}
        onChange={dropAccountErrorIfNeeded}
        onBlur={(event) => {
          if (event.target.value?.length === 0) {
            setAccountError("The field cannot be empty");
          } else {
            dropAccountErrorIfNeeded();
          }
        }}
      />
      <Form.TextField
        id="amount"
        title="Amount"
        placeholder="Optional"
        error={amountError}
        onChange={() => {
          if (amountError) setAmountError(undefined);
        }}
      />
      <Form.TextArea id="memo" title="Description" placeholder="Optional" />

      <Form.Dropdown id="template" title="Template">
        <Form.Dropdown.Item value="compact" title="Compact" />
        <Form.Dropdown.Item value="qr_only" title="QR Only" />
        <Form.Dropdown.Item value="print" title="Print" />
      </Form.Dropdown>
    </Form>
  );
}
