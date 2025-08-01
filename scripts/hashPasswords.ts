import bcrypt from 'bcryptjs'

async function main(): Promise<void> {
    console.log('alice:', await bcrypt.hash('demo1234', 12))
    console.log('bob:  ', await bcrypt.hash('demo1234', 12))
    console.log('carol:', await bcrypt.hash('demo1234', 12))
}

main().catch(err => {
    console.error(err)
    process.exit(1)
})
