function lumise_addon_mydesigns(lumise) {

	lumise.data.draft = '0';

	var wrp = lumise.get.el('saved-designs');

	lumise.design.nav.callback.designs = function () {
		wrp = lumise.get.el('saved-designs');

		if (wrp.attr('data-loaded') != 'true') {

			wrp.attr({ 'data-loaded': 'true' }).html('');
			load_designs();

		}

	};

	lumise.design.my_designs.pre_save = function () {
		wrp = lumise.get.el('saved-designs');
		$('#lumise-navigations').attr({ "data-navigation": "active" });
		// $('ul#lumise-saved-designs').attr({'is' : "save"});
		$('li[data-tool="designs"]').addClass('active');

		if (wrp.attr('data-loaded') != 'true') {

			wrp.attr({ 'data-loaded': 'true' }).html('');

			load_designs();

		}

	};

	lumise.actions.add('after-change-layout', function () {
		let wrp = lumise.get.el('saved-designs');
		wrp.off('scroll click').on('click', handleClick);
	});
	wrp.off('scroll click').on('click', handleClick);

	function handleClick(e) {
		var act = e.target.getAttribute('data-func');

		if (!act)
			return;

		var id = $(e.target).closest('li[data-id]').data('id'),
			name = $(e.target).closest('li[data-id]').find('span[data-view="name"]').text();

		if (!id && act != 'new')
			return;

		switch (act) {

			case 'edit':

				/*
				*	Save design
				*/
				if (id == 'new') {

					do_save(id, name);

					return;

				};

				lumise.tools.save();

				do_edit(id);

				break;

			case 'name':

				var name = $(e.target).text();

				e.target.onblur = function () {
					if (name != $(this).text()) {
						name = $(this).text();
						lumise.post({
							action: 'addon',
							component: 'mydesigns',
							task: 'edit_name',
							id: id,
							name: encodeURIComponent(name)
						});
					}
				};

				break;

			case 'delete':

				if (!confirm(lumise.i('sure')))
					return;

				wrp.attr({ 'data-loading': 'true' }).scrollTop(0);
				query.index = 0;

				lumise.post({
					action: 'addon',
					component: 'mydesigns',
					task: 'delete',
					id: id
				}, load_designs);

				break;
		}
	}

	$('#lumise-designs-search input').off('input').on('keydown', function (e) {
		if (e.keyCode === 13) {
			query.s = this.value;
			query.index = 0;
			load_designs();
			e.preventDefault();
		}
	}).on('click', function (e) {
		setTimeout(function (el) {
			if (el.value === '' && el.value != query.s) {
				query.s = el.value;
				query.index = 0;
				load_designs();
				e.preventDefault();
			}
		}, 100, this);
	});

	var query = {
		s: '',
		index: 0,
		total: 0
	},

		load_designs = function () {

			wrp.attr({ 'data-loading': 'true' });

			lumise.post({
				action: 'addon',
				component: 'mydesigns',
				task: 'list',
				limit: 8,
				index: encodeURIComponent(query.index),
				s: encodeURIComponent(query.s)
			}, function (res) {

				// hash : e2eaa02a68001c7dac59221d7737866a
				if (res == 'login') {
					wrp.attr({ 'data-login': 'true' });
					return render_login_form();
				};

				wrp.removeAttr('data-login').removeAttr('data-loading').html(
					'<li data-view="add" data-func="edit" data-id="new" style="display:inline-block">\
						<b data-func="edit">+</b>\
						<span data-func="edit">Create new design</span>\
					</li>'
				);

				res = JSON.parse(res);

				// [0] items
				// [1] total
				// [2] perpage

				if (typeof res[0] == 'object' && res[0].length > 0) {

					res[0].map(function (r) {
						r.screenshot = lumise.data.upload_url + r.screenshot;
						r.updated = new Date(r.updated).getTime() / 1000;
						r.id = r.did;
						render_designs(r);
					});

					wrp.find('span[data-view="name"]').off('keydown').on('keydown', function (e) {
						if (e.keyCode === 13)
							this.blur();
					});

					query.index = parseInt(query.index) + res[0].length;

					render_pagination(res);

				}

			});

		},

		render_login_form = function (err) {

			wrp.removeAttr('data-loading');

			var form = $('<form id="my-designs-login">\
				<h3>\
					<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="20px" height="20px" viewBox="0 0 486.733 486.733" xml:space="preserve"><path fill="#888" d="M403.88,196.563h-9.484v-44.388c0-82.099-65.151-150.681-146.582-152.145c-2.225-0.04-6.671-0.04-8.895,0   C157.486,1.494,92.336,70.076,92.336,152.175v44.388h-9.485c-14.616,0-26.538,15.082-26.538,33.709v222.632   c0,18.606,11.922,33.829,26.539,33.829h321.028c14.616,0,26.539-15.223,26.539-33.829V230.272   C430.419,211.646,418.497,196.563,403.88,196.563z M273.442,341.362v67.271c0,7.703-6.449,14.222-14.158,14.222H227.45   c-7.71,0-14.159-6.519-14.159-14.222v-67.271c-7.477-7.36-11.83-17.537-11.83-28.795c0-21.334,16.491-39.666,37.459-40.513   c2.222-0.09,6.673-0.09,8.895,0c20.968,0.847,37.459,19.179,37.459,40.513C285.272,323.825,280.919,334.002,273.442,341.362z    M331.886,196.563h-84.072h-8.895h-84.072v-44.388c0-48.905,39.744-89.342,88.519-89.342c48.775,0,88.521,40.437,88.521,89.342   V196.563z"></path></svg> '+ lumise_mydesigns_addon_cfg.s1 + '\
				</h3>\
				<p>\
					<label>'+ lumise_mydesigns_addon_cfg.s2 + ':</label>\
					<input type="text" name="user" />\
				</p>\
				<p>\
					<label>'+ lumise_mydesigns_addon_cfg.s3 + ':</label>\
					<input type="password" name="pass" />\
				</p>\
				<p>\
					<button id="my-designs-login-btn">'+ lumise_mydesigns_addon_cfg.s4 + '</button>\
					<a href="'+ lumise_mydesigns_addon_cfg.reglink + '" data-link="register" target=_blank>' +
				lumise_mydesigns_addon_cfg.s5
				+ '</a>\
				</p>\
			</form>');

			wrp.html('').append(form);

			if (err !== undefined)
				wrp.prepend('<p class="msg-error">' + err + '</p>');

			wrp.find('a').attr({ target: '_blank' });

			form.find('#my-designs-login-btn').on('click', function (e) {
				// Alert before proceeding with login
				if (!confirm("Warning: The page will reload, and your unsaved designs might be lost. Do you want to continue?")) {
					return; // Stop further execution if user cancels the confirmation
				}
				wrp.attr({ 'data-loading': 'true' });

				lumise.post({
					action: 'addon',
					component: 'mydesigns',
					task: 'login',
					user: lumise.fn.enjson(form.find('input[name="user"]').val()),
					pass: lumise.fn.enjson(form.find('input[name="pass"]').val())
				}, function (res) {

					wrp.removeAttr('data-loading');

					if (res == '1') {

						wrp.removeAttr('data-loaded');
						lumise.design.nav.callback.designs();

						wrp.attr({
							'data-view': 'saveas',
							'data-notice': lumise.i(108)
						});

						wrp.prepend(
							'<li data-view="add" data-func="edit" data-id="new">\
								<b data-func="edit">+</b>\
								<span data-func="edit">'+ lumise.i(107) + '</span>\
							</li>'
						);
						
            location.reload();

					} else render_login_form(res);
				});

				e.preventDefault();

			});

		},

		render_designs = function (design) {

			var el = lumise.get.el('saved-designs'),
				editing = lumise.fn.url_var('my-design'),
				lis = '';

			el.find('.empty').remove();

			lis += '<li data-id="' + design.id + '" data-func="edit" data-use-text="USE THIS" title="' + design.created + '">\
						<div data-view="stages" data-title="Edit this design" data-otitle="Edit this design">';

			if (design.screenshots !== undefined) {
				design.screenshots.map(function (s, i) {

					if (!lumise.ops.myDesignThumbns)
						lumise.ops.myDesignThumbns = {};

					if (!lumise.ops.myDesignThumbns[design.id])
						lumise.ops.myDesignThumbns[design.id] = {};

					if (!lumise.ops.myDesignThumbns[design.id][i])
						lumise.ops.myDesignThumbns[design.id][i] = URL.createObjectURL(lumise.fn.url2blob(s));

					lis += '<span data-func="edit">\
						  <img data-func="edit" src="'+ lumise.ops.myDesignThumbns[design.id][i] + '" height="150" />\
						</span>';

				});
			} else if (design.screenshot !== undefined) {
				lis += '<span data-func="edit">\
						  <img data-func="edit" src="'+ design.screenshot + '" height="150" />\
						</span>';
			};

			lis += '</div>\
					<span data-view="func" data-func="delete">\
						<i data-func="delete" class="lumisex-android-delete" style="font-size: 18px;color: #ef4e4e;"></i>\
					</span>\
					<span data-view="name" data-id="'+ design.id + '" data-func="name" title="' + lumise.i(52) + '" data-enter="blur" contenteditable style="padding-bottom:10px;">' +
				(design.name ? design.name : 'Untitled') +
				'</span>\
				</li>';

			el.append(lis);

		},

		render_pagination = function (res) {

			if (res[2] < res[1]) {

				var p = Math.ceil(query.index / res[2]),
					pg = '<li data-view="pagination">';

				if (p > 1)
					pg += '<a href="#' + ((p - 2) * res[2]) + '"><i class="lumisex-ios-arrow-back"></i></a>';

				for (var i = 1; i <= Math.ceil(res[1] / res[2]); i++) {
					if (i == p)
						pg += '<span>' + i + '</span>';
					else pg += '<a href="#' + ((i - 1) * res[2]) + '">' + i + '</a>';
				}

				if (p < Math.ceil(res[1] / res[2]))
					pg += '<a href="#' + (p * res[2]) + '"><i class="lumisex-ios-arrow-forward"></i></a>';

				pg += '<span>Showing ' + query.index + ' of ' + res[1] + '</span>';

				pg += '</li>';

				wrp.append(pg);

				wrp.find('li[data-view="pagination"] a').on('click', function (e) {
					query.index = this.getAttribute('href').replace('#', '');
					load_designs();
					e.preventDefault();
				});

			}
		},

		do_edit = function (id) {

			lumise.fn.set_url('cart', null);
			lumise.fn.set_url('product', null);
			lumise.fn.set_url('product_cms', null);
			lumise.fn.set_url('reorder', null);

			lumise.f(lumise.i('loading'));

			lumise.post({
				action: 'addon',
				component: 'mydesigns',
				task: 'edit_design',
				id: id
			}, function (product) {

				lumise.f(false);

				if (product == '0') {
					$('#lumise-main').html(
						'<div id="lumise-no-product" style="display: inline-block;">\
							<p>You do not have permission to edit this design.</p>\
							<button class="lumise-btn" id="lumise-select-product">\
								<i class="lumisex-android-apps"></i> Select product to design\
							</button>\
						</div>'
					);
					$('#lumise-select-product').on('click', function (e) {
						var btn_txt = lumise.fn.url_var('product') ? lumise.i(80) : lumise.i(87);
						lumise.render.products_list(btn_txt);
						e.preventDefault();
					});
					lumise.fn.set_url('my-design', null);
					return;
				};

				if (typeof product == 'string')
					product = JSON.parse(product);

				product.mydesign = lumise.fn.dejson(product.mydesign);
				product.stages = lumise.fn.dejson(product.stages);
				product.attributes = lumise.fn.dejson(product.attributes);

				lumise.render.product(product, function () {

					function isMyDesign() {
						return true;
					}

					lumise.tools.imports(product.mydesign, isMyDesign);

					$('#lumise-saved-designs li[data-id].active').removeClass('active');
					$('#lumise-saved-designs li[data-id="' + id + '"]').addClass('active');

					delete product;

					var html = '<span>\
									<text>\
										<i class="lumisex-android-alert"></i> \
										You are editting your design <strong>'+ id + '</strong>\
									</text>\
									<button data-func="save-design" title="Ctrl+S to save design">\
										Save design \
										<i class="lumisex-android-done"></i>\
									</button>\
									<a href="#cancel-design">\
										'+ lumise.i('cancel') + '\
									</a>\
								</span>';

					$('#lumise-draft-status').html(html);
					$('#lumise-draft-status button[data-func="save-design"]').on('click', function (e) {
						do_save(lumise.fn.url_var('my-design', 'new'));
						e.preventDefault();
					});
					$('#lumise-draft-status a[href="#cancel-design"]').on('click', function (e) {
						e.preventDefault();
						lumise.fn.set_url('my-design', null);
						$('#lumise-draft-status').html('');
						lumise.tools.clearAll();
					});

				});

			});

		},

		do_save = function (id, name) {

			if (id == 'new') {

				var name = prompt('Enter the design name');

				if (name === null || name === '')
					return;
			};

			lumise.fn.export(function (data, thumbn) {

				data.screenshot = thumbn.screenshot;

				data.name = name;

				formData = new FormData(),
					blob = '',
					upload_size = 100;

				formData.append('action', 'addon');
				formData.append('task', 'upload_design');
				formData.append('ajax', 'frontend');
				formData.append('component', 'mydesigns');
				formData.append('nonce', 'LUMISE-SECURITY:' + lumise.data.nonce);
				formData.append('id', id);
				formData.append('name', encodeURIComponent(name));
				formData.append('prod_cms', lumise.fn.url_var('product_cms', ''));
				formData.append('prod', lumise.fn.url_var('product_base', ''));

				blob = JSON.stringify(data);
				formData.append('data', new Blob([blob]));

				upload_size += blob.length;


				if (lumise.data.max_upload_size > 0 && upload_size / 1024000 > lumise.data.max_upload_size) {
					lumise.fn.notice('Error: your design is too large (' + (upload_size / 1024000).toFixed(2) + 'MB out of max ' + lumise.data.max_upload_size + 'MB)<br>Please contact the administrator to change the server configuration', 'error', 5000);
					return lumise.f(false);
				}

				lumise.f('0% complete');

				$.ajax({
					data: formData,
					type: "POST",
					url: lumise.data.ajax,
					contentType: false,
					processData: false,
					xhr: function () {
						var xhr = new window.XMLHttpRequest();
						xhr.upload.addEventListener("progress", function (evt) {

							if (evt.lengthComputable) {
								var percentComplete = evt.loaded / evt.total;
								if (percentComplete < 1)
									$('div#LumiseDesign').attr({ 'data-msg': parseInt(percentComplete * 100) + '% upload complete' });
								else $('div#LumiseDesign').attr({ 'data-msg': lumise.i(159) });
							}

						}, false);
						return xhr;
					},
					success: function (res, status) {

						lumise.f(false);

						res = JSON.parse(res);

						wrp.removeAttr('data-process').find('.lumise-notice').remove();

						if (res.success === 0) {
							alert(res.message)
						} else {

							if (res !== 1 && res != '1')
								lumise.fn.notice(res, 'error', 5000);
							else lumise.fn.notice('Your design has been saved successfully!', 'success', 5000);

							if (id == 'new')
								query.index = 0;

							load_designs();

						}

					},
					error: function () {
						alert('Error: could not upload design');
					}
				});

			});

		};

	lumise.actions.stack[10]['ctrl-s'] = [function (e) {
		do_save('new');
		e.preventDefault();
	}];

	lumise.actions.add('select-product', function () {
		lumise.fn.set_url('my-design', null);
	});

	lumise.actions.add('cart_edit', function () {
		lumise.fn.set_url('my-design', null);
	});

	if (lumise.fn.url_var('my-design', '') !== '') {

		delete lumise.actions.stack[10]['noproduct'];

		if (lumise.fn.url_var('cart', '') !== '')
			return lumise.fn.set_url('my-design', null);

		do_edit(lumise.fn.url_var('my-design'));

	}

};
