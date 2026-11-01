// Only explicit numbered instructions are reformatted; reading texts retain their source layout.
export function renderGrammarInstructionExample({kind,texts}:{kind:string;texts:string[]}) {
 if(kind!=='grammar'||texts.length!==3)return null;
 const [title,situation,instruction]=texts;
 const lines=instruction.split('\n');
 const steps=lines.slice(0,-1).map(line=>line.match(/^(\d+)\. (.+)$/));
 const last=lines.at(-1)?.match(/^Toepassing: (.+)$/);
 if(!last||steps.length<2||steps.some((step,i)=>!step||Number(step[1])!==i+1))return null;
 const sentences=(text:string)=>text.split(/(?<=[.!?])\s+(?=[A-ZÀ-Ý])/u);
 return <div className="cp-instruction-example">
  <h4>{title}</h4>
  <section className="cp-instruction-context" aria-label="Je situatie"><h4>Je situatie</h4><ul>{sentences(situation).map((text,i)=><li key={i}>{text}</li>)}</ul></section>
  {steps.map((match,i)=>{
   const text=match![2],colon=text.indexOf(': '),parts=sentences(text);
   const lead=colon>=0&&colon<parts[0].length?text.slice(0,colon+1):parts[0];
   const rest=text.slice(lead.length).trim();
   const details=rest?sentences(rest).flatMap(part=>part.split(/, (?=waarom je iets wilt veranderen)| (?=en wat je vraagt)/)):[];
   return <section className="cp-instruction-step" aria-label={`Opdracht ${i+1}`} key={i}><h4><span className="cp-instruction-number">{i+1}</span><span>{lead}</span></h4>{details.length>0&&<ul>{details.map((part,n)=><li key={n}>{part}</li>)}</ul>}</section>;
  })}
  <section className="cp-instruction-application" aria-label="Toepassing"><h4>Toepassing</h4><ul>{sentences(last[1]).map((text,i)=><li key={i}>{text}</li>)}</ul></section>
 </div>;
}
