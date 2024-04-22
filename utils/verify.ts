import { Addressable } from "ethers"
import { run } from "hardhat"

export const verify = async (
  contractAddress: string | Addressable,
  contract: string,
  args: any[]
) => {
  console.log("Verifying contract...");
  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: args,
      contract,
    });
  } catch (e: any) {
    if (e.message.toLowerCase().includes("already verified")) {
      console.log("Already verified!");
    } else {
      console.log(e);
    }
  }
};