
const updates = {name:"maria"};


const fields = [];
const values = [];

for(const key in updates){
  fields.push(`${key} = ?`)
  if(key == "name"){
    values.push("e ne que deu?")
  }else
  values.push(updates[key])

}

const text = `update users set ${fields.join(", ")}`;




console.log(text);
//console.log(values);

/*if(typeof text === "string"){
  console.log("if here");
  
}else{
  console.log("else here");
}*/
