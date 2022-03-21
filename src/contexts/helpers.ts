
import { web3 } from '@project-serum/anchor';
import {
  Keypair,
  PublicKey,
  SYSVAR_CLOCK_PUBKEY,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
  ConfirmOptions,
  SYSVAR_RENT_PUBKEY
} from '@solana/web3.js';

// for rest function
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, Token, MintLayout } from "@solana/spl-token";
import * as anchor from '@project-serum/anchor';


type Event = "connect" | "disconnect";
type DisplayEncoding = "utf8" | "hex";
type PhantomEvent = "disconnect" | "connect";
type PhantomRequestMethod =
  | "connect"
  | "disconnect"
  | "signTransaction"
  | "signAllTransactions"
  | "signMessage";

interface ConnectOpts {
  onlyIfTrusted: boolean;
}
interface Phantom {
  publicKey: PublicKey | null;
  isConnected: boolean | null;
  autoApprove: boolean | null;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
  signMessage: (
    message: Uint8Array | string,
    display?: DisplayEncoding
  ) => Promise<any>;
  connect: (opts?: Partial<ConnectOpts>) => Promise<void>;
  disconnect: () => Promise<void>;
  on: (event: PhantomEvent, handler: (args: any) => void) => void;
  request: (method: PhantomRequestMethod, params: any) => Promise<any>;
}



const IDL = require('./anchor_idl/idl/spin_win');

const confirmOption: ConfirmOptions = {
  commitment: 'finalized',
  preflightCommitment: 'finalized',
  skipPreflight: false
}

// "rnmMFkkuYdz1Gz3V4Pzn1dJb1UasQeYgoAi2WixqiEV"
const PROGRAM_ID = new PublicKey(
  "Cuw7DiTqrwe1vzuXUABq3sToxCXauMKT9UsniivXyruM"
);

let program: any = null;
let provider: any = null;
let poolAccountPDA: any = null;
let poolAccountBump = null;


const PAY_TOKEN = '57pBdnRAjwoYW6PAj3XDQp7Gw8Q6YiS92RRp4azk2zq4';
const payMint = new PublicKey(PAY_TOKEN);

const REWARD_TOKEN = '57pBdnRAjwoYW6PAj3XDQp7Gw8Q6YiS92RRp4azk2zq4';
const rewardMint = new PublicKey(REWARD_TOKEN);

let token_vault_list: any = [];

// test
let mintA: Token;
const mintAuthority = anchor.web3.Keypair.generate();
const initializerMainAccount = anchor.web3.Keypair.generate();
const payer = anchor.web3.Keypair.generate();

const createAssociatedTokenAccountInstruction = (
  associatedTokenAddress: anchor.web3.PublicKey,
  payer: anchor.web3.PublicKey,
  walletAddress: anchor.web3.PublicKey,
  splTokenMintAddress: anchor.web3.PublicKey
) => {
  const keys = [
    { pubkey: payer, isSigner: true, isWritable: true },
    { pubkey: associatedTokenAddress, isSigner: false, isWritable: true },
    { pubkey: walletAddress, isSigner: false, isWritable: false },
    { pubkey: splTokenMintAddress, isSigner: false, isWritable: false },
    {
      pubkey: anchor.web3.SystemProgram.programId,
      isSigner: false,
      isWritable: false,
    },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    {
      pubkey: anchor.web3.SYSVAR_RENT_PUBKEY,
      isSigner: false,
      isWritable: false,
    },
  ];
  return new anchor.web3.TransactionInstruction({
    keys,
    programId: ASSOCIATED_TOKEN_PROGRAM_ID,
    data: Buffer.from([]),
  });
};

const getTokenWallet = async (
  wallet: anchor.web3.PublicKey,
  mint: anchor.web3.PublicKey
) => {
  return (
    await anchor.web3.PublicKey.findProgramAddress(
      [wallet.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
      ASSOCIATED_TOKEN_PROGRAM_ID
    )
  )[0];
};

const testDeposit = async (wallet: any, connection: any) => {
  await connection.confirmTransaction(
    await connection.requestAirdrop(payer.publicKey, 1000000000),
    "processed"
  );

  mintA = await Token.createMint(
    provider.connection,
    payer,
    mintAuthority.publicKey,
    null,
    0,
    TOKEN_PROGRAM_ID
  );

  var myToken = new Token(
    connection,
    mintA.publicKey,
    TOKEN_PROGRAM_ID,
    payer
  );
  var assAccount = await getTokenWallet(poolAccountPDA, mintA.publicKey);
  if ((await connection.getAccountInfo(assAccount)) == null) {
    console.log('aaaaaaaaaa');
    await provider.send(
      (() => {
        let transaction = new Transaction();
        transaction.add(
          createAssociatedTokenAccountInstruction(
            assAccount,
            wallet.publicKey,
            poolAccountPDA,
            mintA.publicKey
          )
        );
        return transaction;
      })(),
      []
    );
  }

  await mintA.mintTo(
    assAccount,
    mintAuthority.publicKey,
    [mintAuthority],
    100
  );

  let tokenAmount = await provider.connection.getTokenAccountBalance(assAccount);
  console.log('444444444444444444', tokenAmount);
}

export const initialize = async (wallet: any, connection: any, transaction: Transaction) => {
  let cloneWindow: any = window;
  provider = new anchor.Provider(connection, cloneWindow['solana'], anchor.Provider.defaultOptions())
  program = new anchor.Program(IDL, PROGRAM_ID, provider);

  // init escrow account ================================
  const [_pool, _pool_bump] = await PublicKey.findProgramAddress([Buffer.from(anchor.utils.bytes.utf8.encode("sw_game_seeds"))], program.programId);
  poolAccountPDA = _pool;
  poolAccountBump = _pool_bump;

  if ((await connection.getAccountInfo(poolAccountPDA)) == null) {
    console.log('initialize start...');

    let escrowAccount = Keypair.generate().publicKey;

    let result = null;
    transaction.add(
      await program.instruction.initialize(
        poolAccountBump,
        {
          accounts: {
            initializer: wallet.publicKey,
            state: poolAccountPDA,
            escrowAccount: escrowAccount,
            systemProgram: anchor.web3.SystemProgram.programId,
          }
        }
      )
    );
  }

  // for testing
  await testDeposit(wallet, connection);

  return true;
}

export const setItemInfos = async (wallet: any, connection: any, transaction: Transaction, payMethodToken: any, payAmount: any) => {
  console.log('Start to Set Item...');

  token_vault_list = [];

  if (payMethodToken) {
    var myToken = new Token(
      connection,
      payMint,
      TOKEN_PROGRAM_ID,
      wallet
    );
    let mintInfo = await myToken.getMintInfo();
    console.log('=========== mintInfo ==========', mintInfo);
    var sourcePayAccount = await myToken.getOrCreateAssociatedAccountInfo(wallet.publicKey);
    var destPayAccount = await myToken.getOrCreateAssociatedAccountInfo(poolAccountPDA.publicKey);
    transaction.add(
      Token.createTransferInstruction(
        TOKEN_PROGRAM_ID,
        sourcePayAccount.address,
        destPayAccount.address,
        wallet.publicKey,
        [],
        payAmount * (10 ** mintInfo.decimals),
      )
    );
  } else {
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: poolAccountPDA,
        lamports: (payAmount * web3.LAMPORTS_PER_SOL),
      })
    );
  }

  let randomPubkey = anchor.web3.Keypair.generate().publicKey;
  let [_token_vault, _token_vault_bump] = await PublicKey.findProgramAddress([Buffer.from(randomPubkey.toBuffer())], PROGRAM_ID);

  token_vault_list.push({ vault: _token_vault, bump: _token_vault_bump });

  let ratio_list = [];
  let amount_list = [];
  for (let i = 0; i < 15; i++) {
    if (i >= 0 && i <= 4) {
      ratio_list.push(2);
    } else if (i >= 5 && i <= 9) {
      ratio_list.push(10);
    } else {
      ratio_list.push(8);
    }
    amount_list.push(new anchor.BN(2));
  }
  console.log('token vault : ', _token_vault.toBase58());
  console.log('pool PDA : ', poolAccountPDA.toBase58());
  console.log('pool PDA111 : ', poolAccountPDA);
  transaction.add(
    await program.instruction.setItem(
      _token_vault_bump,
      ratio_list,
      amount_list,
      {
        accounts: {
          owner: wallet.publicKey,
          state: poolAccountPDA,
          tokenMint: rewardMint,
          tokenVault: _token_vault,
          rand: randomPubkey,
          // rewardAccount: rewardAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY
        },
        // signers: [wallet]
      }
    )
  );

  console.log('End to Set Item...');

  return true;
}

export const doSpinEngine = async (wallet: any, connection: any, transaction: Transaction) => {
  console.log('Start to spin_wheel...');
  transaction.add(
    await program.instruction.spinWheel({
      accounts: {
        state: poolAccountPDA,
      }
    })
  );

  let _state = await program.account.spinItemList.fetch(
    poolAccountPDA
  );

  let spin_res = _state.lastSpinindex + 1;
  let msg = "You could win " + spin_res + " item. ";
  if (_state.lastSpinindex % 2 == 0) {
    msg += "Collect your reward tokens on website.";
    // msg += "YOU HAVE WON THE NFT. You can claim it on website.";
  } else {
    msg += "Collect your reward tokens on website.";
  }

  await claimRewards(wallet, connection, transaction, mintA, _state.lastSpinindex + 1);

  // let t_vault_account = token_vault_list[_state.lastSpinindex];
  // console.log('spin token vault : ', t_vault_account);

  // console.log('last spin index : ', _state.lastSpinindex);
  // transaction.add(
  // await program.instruction.transferRewards(
  //   _state.lastSpinindex,
  //   {
  //     accounts: {
  //       owner: wallet.publicKey,
  //       state: poolAccountPDA,
  //       tokenMint: rewardMint,
  //       tokenVault: t_vault_account.vault,
  //       destAccount: initializerTokenAccountA,
  //       systemProgram: anchor.web3.SystemProgram.programId,
  //       tokenProgram: TOKEN_PROGRAM_ID,
  //     },
  //     signers: [wallet]
  //   })
  // );

  try {
    await wallet.sendTransaction(transaction, connection);
    console.log("SUCCESS");

  } catch (error) {
    console.log('setItemInfos error', error);
    return false;
  }

  console.log('End to spin_wheel...');

  return _state.lastSpinindex;
}

export const spinWheel = async (wallet: any, connection: any) => {
  let transaction = new Transaction();

  if (await initialize(wallet, connection, transaction) == false) {
    return false;
  }

  if (await setItemInfos(wallet, connection, transaction, false, 0.1) == false) {
    return false;
  }

  return await doSpinEngine(wallet, connection, transaction);
}

export const deposit = async (wallet: any, connection: any, mintA: any, amount: any) => {
  var myToken = new Token(
    connection,
    mintA,
    TOKEN_PROGRAM_ID,
    wallet
  );

  let _state = await program.account.spinItemList.fetch(
    poolAccountPDA
  );

  let mintInfo = await myToken.getMintInfo();
  var sourceAccount = await myToken.getOrCreateAssociatedAccountInfo(wallet.publicKey);
  var destAccount = await myToken.getOrCreateAssociatedAccountInfo(_state.escrowAccount);

  let bnAmount = amount * (10 ** mintInfo.decimals);
  let tokenAmount = await provider.connection.getTokenAccountBalance(sourceAccount.address);

  await myToken.transfer(
    sourceAccount.address,
    destAccount.address,
    wallet.publicKey,
    [wallet],
    new anchor.BN(bnAmount),
  );
}

export const claimRewards = async (wallet: any, connection: any, transaction: Transaction, mintA: any, amount: any) => {
  var myToken = new Token(
    connection,
    mintA.publicKey,
    TOKEN_PROGRAM_ID,
    payer
  );

  let mintInfo = await myToken.getMintInfo();
  var sourceAccount = await getTokenWallet(poolAccountPDA, mintA.publicKey);
  var destAccount = await myToken.getOrCreateAssociatedAccountInfo(wallet.publicKey);

  let tokenAmount = await provider.connection.getTokenAccountBalance(destAccount.address);
  console.log('~~~~~~~~~~~~~~~~~~~~~~~333', tokenAmount);

  let bnAmount = amount * (10 ** mintInfo.decimals);

  transaction.add(
    await program.instruction.claim(
      new anchor.BN(bnAmount),
      {
        accounts: {
          owner: wallet.publicKey,
          state: poolAccountPDA,
          sourceRewardAccount: sourceAccount,
          destRewardAccount: destAccount.address,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
      })
  );

  tokenAmount = await provider.connection.getTokenAccountBalance(destAccount.address);
  console.log('~~~~~~~~~~~~~~~~~~~~~~~444', tokenAmount);
}