let pesquisaPorNome = document.querySelector('#formulario')
let filmes = document.querySelector('.filmes')
let formUsuarioIa = document.getElementById('formIA');

/* id da sessao para salvar no banco de dados e os filmes favoritados irem para la */
if (!localStorage.getItem("usuario_id")) {
    localStorage.setItem("usuario_id", crypto.randomUUID())
}

/* Função que faz fetch do omdb que procura o filme pelo input do usuario */
async function buscarFilmesPorNome(nome){
    const resposta = await fetch(`https://www.omdbapi.com/?apikey=dfafd03e&s=${nome}`);
    const data = await resposta.json();
    console.log(data)
    return data
}

/* Apos o usuário clicar o botao pesquisaPorNome, ele envia o valor para a função buscarFilmesPorNome e imprime os resultados retornados na div .filmes */
pesquisaPorNome.addEventListener('submit', async e => {
    e.preventDefault()
    
    let input = document.querySelector('#nome').value
    let conteudo = await buscarFilmesPorNome(input)
    let ano;
    filmes.innerHTML = ''

    for (let contador = 0; contador<conteudo.Search.length; contador++) {
        ano = conteudo.Search[contador].Year[conteudo.Search[contador].Year.length-1] !== '–' ? conteudo.Search[contador].Year : conteudo.Search[contador].Year+'Atual'

        filmes.innerHTML += `
            
                <div class="resultado">
                    <a href="https://www.imdb.com/pt/title/${conteudo.Search[contador].imdbID}/" target="_blank">
                    <img src="${conteudo.Search[contador].Poster}" alt="" onerror="this.src='imgs/imgSemPoster.png'">
                    <h3>${conteudo.Search[contador].Title}</h3>
                    <span>${ano}</span>
                    </a>
                    <button class="favorito" data-id="${conteudo.Search[contador].imdbID}">Favoritar</button>
                </div>
            
        `
    }
});

async function buscarFilmesPorID(id){
    const resposta = await fetch(`https://www.omdbapi.com/?apikey=dfafd03e&i=${id}`)
    const data = await resposta.json()
    return data
}

let gemini1 = 'Ab8RN6L6YwROjmw9cKYf4BgkMG'
let gemini2 = '_QJGv5VXfji4AnkcHjiWT1Tw'
/* Função assincrona que manda pra ia um prompt */
async function recomendarFilmes(prompt) {
    filmes.textContent = 'Carregando...'
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${'AQ.'+gemini1+gemini2}`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]}]})});

    const data = await response.json();
    filmes.textContent = '' //simboliza fim do carregamento
    return data.candidates[0].content.parts[0].text // caminho ate chegar no resultado
}
let prompt; 
let inputIA;

/*
    Ao usuário clicar o botão "perguntar a IA", ele executa a função assincrona e joga um prompt pronto + o que usuario digitou.
    Retorna um arquivo JSON com id de filmes do imdb, em que jogaremos no fetch do OMDB para ele nos retornar o poster, titulo e ano.
*/
formUsuarioIa.addEventListener('submit',async e => {
    e.preventDefault()
    filmes.innerHTML = ''
    inputIA = document.getElementById('inputIA').value
    prompt = `
Você é um sistema de recomendação de filmes.

Analise a preferência do usuário:

"${inputIA}"

Escolha exatamente 4 filmes compatíveis.

ATENÇÃO:
- Retorne APENAS JSON válido.
- Não escreva nenhuma explicação.
- Não use markdown.
- Não use '' ou relacionados
- Não escreva frases antes ou depois.
- Cada valor deve ser somente o ID do IMDB.

O formato obrigatório é:

{
  "filme1": "tt0000000",
  "filme2": "tt0000000",
  "filme3": "tt0000000",
  "filme4": "tt0000000"
}
`
    
    let respostaIA = await recomendarFilmes(prompt)
    objJS = JSON.parse(respostaIA) // Transforta texto json pra objeto js

    let ano;
    let conteudo; 
    for (let contador = 1; contador<=4; contador++){
        conteudo = await buscarFilmesPorID(objJS[`filme${contador}`])
        ano = conteudo.Year[conteudo.Year.length-1] !== '–' ? conteudo.Year : conteudo.Year+'Atual'

        filmes.innerHTML += `
            
                <div class="resultado">
                    <a href="https://www.imdb.com/pt/title/${conteudo.imdbID}/" target="_blank">
                    <img src="${conteudo.Poster}" alt="" onerror="this.src='imgs/imgSemPoster.png'">
                    <h3>${conteudo.Title}</h3>
                    <span>${ano}</span>
                    </a>
                    <button class="favorito" data-id="${conteudo.imdbID}">Favoritar</button>
                </div>
            
        `
    }
})




const botaoFavorito = document.querySelectorAll('.favorito')

/* banco de dados */
const supabaseUrl = "https://mkatigffatwpxmjchdgf.supabase.co"
const supabaseKey = "sb_publishable_LrgvPCYlbuzzOqJ2AVaGNQ_mi1wjwjg"

const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey)

filmes.addEventListener('click', async e => {

    const botao = e.target

    if(botao.textContent === "Favoritar") {
        const imdbID = botao.dataset.id
        const conteudo = await buscarFilmesPorID(imdbID)

        const { error } = await supabaseClient
            .from('favoritos')
            .insert({
                id_usuario: localStorage.getItem('usuario_id'),
                id_filme: conteudo.imdbID,
                nome_filme: conteudo.Title,
                ano: conteudo.Year,
                poster: conteudo.Poster
            })


        if(error){
            console.log(error)
            alert("Erro ao favoritar o filme.")
            return
        }

        console.log('armazenado no banco')
        botao.textContent = "Desfavoritar"

    } else {
        const imdbID = botao.dataset.id


        const { error } = await supabaseClient
            .from('favoritos')
            .delete()
            .eq('id_usuario', localStorage.getItem('usuario_id'))
            .eq('id_filme', imdbID)

        if(error){
            console.error(error)
            alert("Erro ao desfavoritar filme.")
            return
        }

        console.log('removido do banco')
        botao.textContent = "Favoritar"
    }

})