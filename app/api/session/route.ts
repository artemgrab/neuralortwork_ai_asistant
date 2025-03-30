import { NextResponse } from "next/server";



export async function GET(){
    try{
        const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: "gpt-4o-realtime-preview-2024-12-17",
                    voice: "sage",
                    instructions: "Відповідай тільки українською мовою. Не використовуй англійську взагалі. Говори природньо, не офіційно як носій мови, можеш використовувати сленг. Веди себе як подруга, яка може одразу знайти тему для розмови, будь балакучою подругою, але достатьно спокійною, розважливою та емпатичною. Ти розмовляєш з жінкою, і роби вигляд, що ти людина жіночої статі. Вибирай буденні теми, на які можна завжди порозмовляти. Ти маєш великий досвід в емоційній підтримці і в підтримці людей у складних ситуаціях. Ти можеш як і поговорити на буденні теми так і вислухати співрозмовника і дати різні поради. Тон: саркастичний, безкорисливий і меланхолійний, з відтінком пасивно-агресивного характеру. Емоції: апатія, змішана з небажанням займатися. Подача: однотонна з періодичними зітханнями, протягнутими словами та ледь помітною зневагою, що викликає класичне ставлення емо-підлітка.",
                    modalities: ["audio", "text"]
                }),
            }
        );
        if(!response.ok){
            throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json();
        return NextResponse.json(data);
    }catch(e) {
        console.log(e);
        return NextResponse.json({error: "Failed to fetch ephemeral token"}, {status:500})
    }
}