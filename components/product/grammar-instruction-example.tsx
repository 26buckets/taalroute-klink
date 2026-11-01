// One source-bound layout example; other lessons retain their approved presentation.
export function renderGrammarInstructionExample({id,texts}:{id:string;texts:string[]}) {
 if(id!=='content:kg-b1-g62-001'||texts.length!==3)return null;
 const [title,situation,instruction]=texts;
 const lines=instruction.split('\n');
 const first=lines[0]?.match(/^(1\. Schrijf drie korte alinea’s): (.+)\. (Gebruik .+)$/);
 const second=lines[1]?.match(/^(2\. Herstel): (.+?\.) (Maak .+)$/);
 const last=lines[2]?.match(/^Toepassing: (.+)$/);
 const context=situation.match(/[^.!?]+[.!?]+(?:\s|$)/g);
 if(!first||!second||!last||lines.length!==3||!context||context.join('')!==situation)return null;
 return <div className="cp-instruction-example">
  <h4>{title}</h4>
  <section aria-label="Je situatie"><h4>Je situatie</h4><ul>{Array.from({length:Math.ceil(context.length/2)},(_,i)=><li key={i}>{context.slice(i*2,i*2+2).join('').trim()}</li>)}</ul></section>
  <section aria-label={first[1]}><h4>{first[1]}</h4><ul>{first[2].split(/, (?=waarom)| (?=en wat)/).map((part,i)=><li key={i}>{part}</li>)}</ul><p>{first[3]}</p></section>
  <section aria-label={second[1]}><h4>{second[1]}</h4><p>{second[2]}</p><p>{second[3]}</p></section>
  <section aria-label="Toepassing"><h4>Toepassing</h4><p>{last[1]}</p></section>
 </div>;
}
