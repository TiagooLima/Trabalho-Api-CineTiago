let filmes = document.querySelector('.filmes')

/* id da sessao para salvar no banco de dados e os filmes favoritados irem para la */
if (!localStorage.getItem("usuario_id")) {
    localStorage.setItem("usuario_id", crypto.randomUUID())
}

/* conexão com supabase */
const supabaseUrl = "https://mkatigffatwpxmjchdgf.supabase.co"
const supabaseKey = "sb_publishable_LrgvPCYlbuzzOqJ2AVaGNQ_mi1wjwjg"

const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey)

async function carregarFavoritos(){
    const usuario = localStorage.getItem('usuario_id')
    const { data, error } = await supabaseClient
        .from('favoritos')
        .select('*')
        .eq('id_usuario', usuario)
    if(error){
        console.log(error)
        return
    }

    filmes.innerHTML = ''

    if(data.length === 0){
        filmes.innerHTML = `<h2>Você ainda não possui favoritos.</h2>`
        return
    }

    data.forEach(filme => {
        filmes.innerHTML += `
        <div class="resultado">

            <a href="https://www.imdb.com/pt/title/${filme.id_filme}/" target="_blank">
                <img src="${filme.poster}" alt="" onerror="this.src='imgSemPoster.png'">
                <h3>${filme.nome_filme}</h3>
                <span>${filme.ano}</span>
            </a>

            <button class="favorito" data-id="${filme.id_filme}">Desfavoritar</button>
        </div>
        `
    })
}


filmes.addEventListener('click', async e => {
    
    const imdbID = e.target.dataset.id
    const { error } = await supabaseClient
        .from('favoritos')
        .delete()
        .eq('id_usuario', localStorage.getItem('usuario_id'))
        .eq('id_filme',  imdbID)

    if(error){
        console.log(error)
        alert("Erro ao remover favorito")
        return
    }

    // remove o card da tela
    e.target.parentElement.remove()
})

carregarFavoritos()
