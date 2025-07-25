const input = [1, 2, 3];
const output = [...input];
console.log("The result for the first exercise is:");
console.log(output);
const input2 = [1,2];
const input3 = [3,4];
const output2 = [...input2, ...input3];
console.log("The result for the second exercise is:");
console.log(output2);
function sum(array){
    let total = 0;
    for (let i = 0; i < array.length; i++) {
        total += array[i];
    }
    return total;
}
output3=sum([...input]);
console.log("The result for the third exercise is:");
console.log(output3);
const Person = {
    name:"Alice",
    age:25
}
const output4 = {...Person};
console.log("The result for the fourth exercise is:");
console.log(output4);
const input5a = { a: 1 };
const input5b = { b: 2 };
const output5 = { ...input5a, ...input5b };
console.log("The result for the fifth exercise is:");
console.log(output5);

const output6 = { ...Person, age: 30 };
console.log("The result for the sixth exercise is:");
console.log(output6);

const Person3 = {
    name: "Bob",
    age: 40
}
const {name:PersonName} = Person3;
console.log("The result for the seventh exercise is:");
console.log(PersonName);
const input4={
    theme: "dark"
}
const {theme,FontSize} = input4;
const finalTheme = theme ?? "light";
const finalFontSize = FontSize ?? 14;
console.log("The result for the eighth exercise is:");
console.log(`${finalTheme} for theme, ${finalFontSize} for fontSize`);

const input5 = {
    name: "Alice",
    address:{
        city:"Paris"
    }
}
const output7 = input5?.address?.city;
const output8 = input5?.address?.email;
console.log("The result for the ninth exercise is:");
console.log(`${output7} for user.address.city, ${output8} for user.address.email`);

const input6 = { getName: () => 'Alice' };
const outputName = input6.getName?.();
const outputAge = input6.getAge?.();
console.log("The result for the tenth exercise is:");
console.log(`${outputName} for getName, ${outputAge} for getAge`);

const input7 = [1, 2, 3, 4];
const output9 = [...input7];
output9[2] = 99;
console.log("The result for the eleventh exercise is:");
console.log(output9);
const objA = { a: 1 };
const objB = { b: 2 };
const output10 = { ...objA, ...objB };
console.log("The result for the twelfth exercise is:");
console.log(output10);

function sum2(...nums) {
    let total = 0;
    for (const n of nums) {
        total += n;
    }
    return total;
}
const input8 = [1, 2, 3];
const output11 = sum2(...input8);
console.log("The result for the thirteenth exercise is:");
console.log(output11);


const input9 = {
    name: 'Alice',
    contact: { email: 'alice@example.com' }
};
const {contact: { email: userEmail }} = input9;
console.log("The result for the fourteenth exercise is:");
console.log(userEmail);

const input10 = [10, 20];
console.log("The result for the fifteenth exercise is:");
console.log(
    `${input10?.[1]} for arr[1], ${input10?.[5]} for arr[5]`
);
const Person4 = {
    id: 1,
    name: "Alice"
}
const Person5 = {
    id: 2,
    age:25
}
const output12 = { ...Person4, ...Person5 };
console.log("The result for the sixteenth exercise is:");
console.log(output12);

const input11 = { name: 'Bob', age: null };
const input12 = { age: 30 };
const {
    name: name11,
    age: age11
} = input11;
const { age: age12 } = input12;
const output13 = {
    name: name11,
    age: age11 ?? age12
};
console.log("The result for the seventeenth exercise is:");
console.log(output13);


const input13 = [
    { id: 1, data: { name: 'John' } },
    { id: 2 }
];
const firstName  = input13[0]?.data?.name;
const secondName = input13[1]?.data?.name;
console.log("The result for the eighteenth exercise is:");
console.log(
    `${firstName} for first object, ${secondName} for second object`);


const input14 = {
    person: {
        name: 'Alice',
        address: { city: 'Paris' }
    }
};

const output14 = {
    person: {
        ...input14.person,
        address: { ...input14.person.address }
    }
};
console.log("The result for the nineteenth exercise is:");
console.log(output14);

const input15 = [[1, 2], [3, 4]];
const output15 = [...input15[0], ...input15[1]];
console.log("The result for the twentieth exercise is:");
console.log(output15);

const input16 = 'hello';
const output16 = [...input16];
console.log("The result for the twenty-first exercise is:");
console.log(output16);



const input17 = null;
const output17 = input17 ?? 'default';
console.log("The result for the twenty-second exercise is:");
console.log(output17);


const input18a = [1, 2];
const input18b = [3, 4];
const input18c = [5, 6];
const output18 = [...input18a, ...input18b, ...input18c];
console.log("The result for the twenty-third exercise is:");
console.log(output18);


const input19 = { person: { getDetails: () => { return { name: 'John' }; } } }
const output19 = input19.person?.getDetails?.()?.name;
console.log("The result for the twenty-fourth exercise is:");
console.log(output19);

const input20 = [1,2];
const [first, second] = input20;
console.log("The result for the twenty-fifth exercise is:");
console.log(`first = ${first}, second = ${second}`);

const input21 = { person: { name: null, age: 30 } }
output21 = input21.person?.name ?? 'Anonymous';
console.log("The result for the twenty-sixth exercise is:");
console.log(`person.name ?? 'Anonymous' results in ${output21}`);

const input22a = { id: 1, name: 'Alice' };
const input22b = { id: 2, age: 25 };
const output22 = { ...input22a, ...input22b };
console.log("The result for the twenty-seventh exercise is:");
console.log(output22);

const input23 = { theme: 'dark', fontSize: null };
const defaults = { theme: 'light', fontSize: 14 };
const output23 = {
    theme: input23.theme ?? defaults.theme,
    fontSize: input23.fontSize ?? defaults.fontSize
};
console.log("The result for the twenty-eighth exercise is:");
console.log(output23);

const input24 = { id: 1, name: 'Alice', age: 25 };
const { name, ...output24 } = input24;
console.log("The result for the twenty-ninth exercise is:");
console.log(output24);

const input25 = [{ name: 'Alice' }, null, { name: 'Bob' }];
const output25 = input25.map(item => item?.name);
console.log("The result for the thirtieth exercise is:");
console.log(output25);