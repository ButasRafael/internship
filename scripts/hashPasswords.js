import bcrypt from 'bcryptjs';

async function go() {
    console.log('alice:', await bcrypt.hash('demo1234', 12));
    console.log('bob:  ',   await bcrypt.hash('demo1234', 12));
    console.log('carol:', await bcrypt.hash('demo1234', 12));
}
go();
