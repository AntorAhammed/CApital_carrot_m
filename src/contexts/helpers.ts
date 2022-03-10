
import { web3 } from '@project-serum/anchor';
import {
  Keypair,
  PublicKey,
  SYSVAR_CLOCK_PUBKEY,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
  SYSVAR_RENT_PUBKEY
} from '@solana/web3.js';

// for rest function
import { Token, TOKEN_PROGRAM_ID, AccountLayout, MintLayout } from "@solana/spl-token";
//import { TokenInfo } from '@solana/spl-token-registry';
import * as borsh from 'borsh';
import bs58 from 'bs58';
import * as anchor from '@project-serum/anchor';

import axios from 'axios';
import BN from 'bn.js';
import fs from 'fs';
import { WalletContextState } from '@solana/wallet-adapter-react';

const IDL = require('./anchor_idl/idl/horse_racing');

const solConnection = new web3.Connection(web3.clusterApiUrl("devnet"));
const PROGRAM_ID = new PublicKey(
  "A6cVVNvApCWnxWBzfUt8PngxKVc9z7WcSwHg3tZtGbv"
);

let program: any = null;
let pool_account_pda: PublicKey;
let pool_account_bump: any;
let vault_account_pda: PublicKey;
let vault_account_bump: any;
let vault_authority_pda: PublicKey;
const initializerMainAccount = anchor.web3.Keypair.generate();
let mintA: Token;
let initializerTokenAccountA: any;

let token_vault_list: any = [];


export const initialize = async (wallet: any) => {
  let payer = wallet;
  let cloneWindow: any = window;
  let provider = new anchor.Provider(solConnection, cloneWindow['solana'], anchor.Provider.defaultOptions())
  program = new anchor.Program(IDL, PROGRAM_ID, provider);

  /////////////////////////////////////
  // mint token creation
  const mintAuthority = anchor.web3.Keypair.generate();
  await provider.connection.confirmTransaction(
    await provider.connection.requestAirdrop(payer.publicKey, 1000000000),
    "processed"
  );

  // Fund Main Accounts
  await provider.send(
    (() => {
      const tx = new Transaction();
      tx.add(
        SystemProgram.transfer({
          fromPubkey: payer.publicKey,
          toPubkey: initializerMainAccount.publicKey,
          lamports: 100000000,
        })
      );
      return tx;
    })(),
    [payer]
  );

  mintA = await Token.createMint(
    provider.connection,
    payer,
    mintAuthority.publicKey,
    null,
    0,
    TOKEN_PROGRAM_ID
  );

  const initializerAmount = 500;
  initializerTokenAccountA = await mintA.createAccount(initializerMainAccount.publicKey);
  await mintA.mintTo(
    initializerTokenAccountA,
    mintAuthority.publicKey,
    [mintAuthority],
    initializerAmount
  );

  let _initializerTokenAccountA = await mintA.getAccountInfo(initializerTokenAccountA);
  if (_initializerTokenAccountA.amount.toNumber() != initializerAmount) {
    alert('initializerAmount err');
  }

  /////////////////////////////////////


  let [_pool, _pool_bump] = await PublicKey.findProgramAddress([Buffer.from(anchor.utils.bytes.utf8.encode("sw_game_seeds"))], program.programId);
  pool_account_pda = _pool;
  pool_account_bump = _pool_bump;

  const [_vault_account_pda, _vault_account_bump] = await PublicKey.findProgramAddress(
    [Buffer.from(anchor.utils.bytes.utf8.encode("sw_token-seed"))],
    program.programId
  );
  vault_account_pda = _vault_account_pda;
  vault_account_bump = _vault_account_bump;

  const [_vault_authority_pda, _vault_authority_bump] = await PublicKey.findProgramAddress(
    [Buffer.from(anchor.utils.bytes.utf8.encode("escrow"))],
    program.programId
  );
  vault_authority_pda = _vault_authority_pda;

  console.log('initialize start...');

  await program.rpc.initialize(
    _pool_bump,
    {
      accounts: {
        initializer: initializerMainAccount.publicKey,
        state: pool_account_pda,
        systemProgram: anchor.web3.SystemProgram.programId,
      },
      signers: [initializerMainAccount]
    }
  );

  console.log('initialize end...');

}

export const setItemInfos = async (wallet: any) => {
  console.log('Start to Set Item...');

  token_vault_list = [];

  for (let i = 0; i < 15; i++) {
    let randomPubkey = anchor.web3.Keypair.generate().publicKey;
    let [_token_vault, _token_vault_bump] = await PublicKey.findProgramAddress([Buffer.from(randomPubkey.toBuffer())], PROGRAM_ID);

    token_vault_list.push({ vault: _token_vault, bump: _token_vault_bump });

    let ratio = i == 14 ? 30 : 5;
    await program.rpc.setItem(
      _token_vault_bump,
      i,
      ratio,
      new anchor.BN(2),
      {
        accounts: {
          owner: initializerMainAccount.publicKey,
          state: pool_account_pda,
          tokenMint: mintA.publicKey,
          tokenVault: _token_vault,
          rand: randomPubkey,
          rewardAccount: initializerTokenAccountA,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY
        },
        signers: [initializerMainAccount]
      }
    );
  }

  console.log('End to Set Item...');
}

export const doSpinEngine = async (wallet: any) => {
  console.log('Start to spin_wheel...');
  await program.rpc.spinWheel({
    accounts: {
      state: pool_account_pda,
    }
  });

  let _state = await program.account.spinItemList.fetch(
    pool_account_pda
  );

  let t_vault_account = token_vault_list[_state.lastSpinindex];
  console.log('spin token vault : ', t_vault_account);

  console.log('last spin index : ', _state.lastSpinindex);
  await program.rpc.transferRewards(
    _state.lastSpinindex,
    {
      accounts: {
        owner: initializerMainAccount.publicKey,
        state: pool_account_pda,
        tokenMint: mintA.publicKey,
        tokenVault: t_vault_account.vault,
        destAccount: initializerTokenAccountA,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      },
      signers: [initializerMainAccount]
    });

  console.log('End to spin_wheel...');
}

export const spinWheel = async (wallet: any) => {
  initialize(wallet);
  setItemInfos(wallet);
}