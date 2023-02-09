import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const chatgptEmail = process.env.CHATGPT_EMAIL;
const chatgptPassword = process.env.CHATGPT_PASSWORD;
async function main() {
  await prisma.chatGPTAccount.deleteMany();
  let accounts = [];
  //  try read ../account.json as accounts
  try {
    accounts = require('../account.json');
  } catch (err) {
    accounts = [
      {
        email: chatgptEmail,
        password: chatgptPassword,
      },
    ];
    console.log('No account.json found, using env variables');
  }
  console.log('Seeding accounts...');
  console.log(accounts);
  await prisma.chatGPTAccount.createMany({
    data: accounts,
  });
  console.log('Seed Success!');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
