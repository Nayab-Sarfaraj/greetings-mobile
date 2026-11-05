import { PaymentRequiredError } from "../../lib/errors";
import {
  entitlementRepository,
  InsufficientBalance,
} from "./entitlement.repository";
export const entitlementService = {
  getBalance: entitlementRepository.balance,
  grant: entitlementRepository.grant,
  refund: entitlementRepository.refund,
  async consume(owner: string, renderId: string, sequence = 1) {
    try {
      return await entitlementRepository.consume(owner, renderId, sequence);
    } catch (error) {
      if (error instanceof InsufficientBalance)
        throw new PaymentRequiredError(
          "Choose an export pack to make this HD video",
        );
      throw error;
    }
  },
};
