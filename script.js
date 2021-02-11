const listUrl = 'https://pokeapi.co/api/v2/pokemon?limit=20';
const detailsArray = [];
let gotData = false;
let currentRow = 0;
let index = 0;

let selectedId;

function getData(url) {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: url,
            success: function(res) {
                resolve(res);
            },
            error: function(err) {
                reject(err);
            }
        });
    });
}

function toSentenceCase(word) {
    return word.charAt(0).toUpperCase() + word.substr(1).toLowerCase();
}

const showModal = async (id) => {

    $('#modal-body').empty();
    const clicked = detailsArray.find(pokemon => String(pokemon.id) === String(id));
    $('.modal-title').text(toSentenceCase(clicked.name));
    const imgCol = $('<div>').addClass('col-md-4');
    const descCol = $('<div>').addClass('col-md-8');

    const img = $(`<img class="modal-img" src="${clicked.sprites.front_shiny}" alt="${clicked.name}">`);
    const listHeader = $('<h5>').text('Ability').css('text-decoration', 'underline');
    const desc = $(`<p class="modal-desc">Loading..</p>`);
    imgCol.append(img);
    descCol.append(listHeader, desc);
    $('#modal-body').append(imgCol, descCol);

    try {
        const details = await getData(clicked.abilities[0].ability.url);
        if (details && !!details.effect_entries && Array.isArray(details.effect_entries) &&
        details.effect_entries.length > 0 && details.effect_entries.some(entry => entry.language.name.toLowerCase() === 'en')) {
            const description = details.effect_entries.find(entry => entry.language.name.toLowerCase() === 'en');
            $('.modal-desc').text(description.effect);
        } else {
            $('.modal-desc').text('Not found! :(').css('font-style', 'italic');
        }
    } catch (error) {
        console.log('The Api is down! :(');
    }
}

const showDetails = async (id) => {

    try {
        const pokemon = await getData(`https://pokeapi.co/api/v2/pokemon/${id}/`);
        if (pokemon) {
            $('#title').text(toSentenceCase(pokemon.name));
            const img = $(`<img class="modal-img" src="${pokemon.sprites.front_shiny}" alt="${pokemon.name}">`);
            const abilities = $('#abilities');
            const moves = $('#moves');
            $('#details').prepend(img);
            if (pokemon.abilities && pokemon.abilities.length > 0) {
                pokemon.abilities.map(ability => toSentenceCase(ability.ability.name))
                    .forEach(ability => {
                        abilities.append(`<li>${ability}</li>`);
                    });
            }
            if (pokemon.moves && pokemon.moves.length > 0) {
                pokemon.moves.map(move => toSentenceCase(move.move.name))
                    .forEach((move, index) => {
                        if (index > 14) return;
                        moves.append(`<li>${move}</li>`);
                    });
            }
        }
    } catch (error) {
        console.log(error);
    }
    
}

function formatDisplay(pokemon) {

    detailsArray.push(pokemon);
    // Get or insert new row
    let row;
    if (index % 4 === 0) {
        currentRow++;
        row = $(`<div class="row card-deck" id="row${String(currentRow)}"></div>`);
        $('.container').append(row);
    } else {
        row = $(`#row${currentRow}`);
        const img = $(`<img class="card-img-top" src="${pokemon.sprites.front_shiny}" alt="${pokemon.name}">`);
        
    }

    // Format and append content
    const card = $('<div>').addClass('card').addClass('col-sm-4');
    const img = $(`<img class="card-img-top" src="${pokemon.sprites.front_shiny}" alt="${pokemon.name}">`);

    const cardBody = $('<div class="card-body d-flex flex-column">');
    const name = $(`<button type="button" id="details-btn" class="btn btn-primary btn-lg" data-id="${pokemon.id}"
        data-toggle="modal" data-target="#details-modal">${toSentenceCase(pokemon.name)}</button>`);
    const pokeUrl = $(
        `<button type="button" class="btn btn-link text-truncate details-btn" value="${pokemon.name}" data-id="${pokemon.id}">
            <a href="/details.html?data-id=${pokemon.id}">
            Click for more details</a>
        </button>`
    );

    cardBody.append(name, pokeUrl);
    card.append(img, cardBody);

    row = $(`#row${currentRow}`);
    row.append(card);
    index++;
}

async function initializeApp() {

    try {
        // Get initial pokemon list
        let data = await getData(listUrl);
        if (data && !!data.results && data.results.length > 0) {
            gotData = true;
            // Get details for each pokemon
            data.results.map(obj => obj.url)
                .forEach(async (url) => {
                    let res = await getData(url);
                    if (res) {
                        formatDisplay(res);
                    }
                });
        }
    } catch (error) {
        console.log('The Api is down! :(');
    } finally {
        if (!gotData) initializeApp();
    }
} 

$(document).ready(function () {

    const urlParams = new URLSearchParams(window.location.search);

    if (!gotData && !urlParams.has('data-id'))  {
        initializeApp();
    } else {
        selectedId = urlParams.get('data-id');
        showDetails(urlParams.get('data-id'));
    }

    $('body').on('click', '#details-btn', function() {
        selectedId = $(this).attr('data-id');
        showModal($(this).attr('data-id'));
    });
});
