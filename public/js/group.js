$(function () {

    var url = new URL(window.location.href);
    var code = url.searchParams.get("code");
    var user = url.searchParams.get("user");
    if(user) 
        localStorage.setItem('user_group_' + code, user);
    else
        user = localStorage.getItem('user_group_' + code);

    if(!user) {
        $('#participanteForm').attr('action', '/api/grupo/'+code+'/ingressar')
        $("#ingressar").show()
        return;
    }

    $("#participando").show()

    var isAdmin;
    var reloadGroup = function () {
        $('#hasError').hide();
        if(!isAdmin)
            $('#adminBar').hide();
        $.ajax({
            url: '/api/grupo/' + code + '/' + user,
            dataType: 'json',
            success: function (data) {
                document.title = data.nome

                $('#nomeGrupo').html(data.nome);
                var lis = '';
                data.participantes.forEach(item => {
                    let tags = '';
                    if(item.uuid == user) {
                        tags += '(você)';

                        if(item.is_admin) {
                            isAdmin = true;
                            $("#adminBar").show();
                        }
                    }
                    if(item.is_admin) {
                        tags += '(criador)';
                    }
                    if(item.uuid == user) {
                        if(typeof item.amigosecreto == 'number') {
                            $('#aguardandosorteio').hide();
                            $('#seuamigo').html('Seu amigo(a) secreto é <strong>'+data.participantes[item.amigosecreto].nome+'</strong><br/><small>Tire um print para não se esquecer hein! =) </small>').show();
                        }
                    }
                    lis += '<li>' + item.nome + ' ' + tags + '</li>';
                })

                $('#participantes').html(lis)

                if(!data.finalizado) {
                    setTimeout(reloadGroup, 2000);
                } else {
                    $('#adminBar').hide();
                }
            },
            error: function (a,b,c) {
                console.log(a,b,c)
                $('#hasError').show();
                setTimeout(reloadGroup, 2000);
            }
        });
    }

    reloadGroup();

    link = window.location.protocol + '//' + window.location.host + '/group.html?code=' + code;
    $('#whatslink').attr('href', 'whatsapp://send?text=' + encodeURIComponent('Oi pessoal =) cliquem no link abaixo, coloquem seu nome e aguardem o sorteio para o amigo secreto :P ' + link));

    $('#finishAndSort').click(function () {
        $.ajax({
            url: '/api/grupo/' + code + '/finish/' + user,
            success: function (success) {
                reloadGroup();
            }
        });
    })
});