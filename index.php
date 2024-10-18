<?php
/*
Name: My Designs
Description: Storage user's designs on server
Version: 1.0
Compatible: 1.7
platform: woocommerce
*/

class lumise_addon_mydesigns extends lumise_addons {
	
	function __construct() {
		
		global $lumise;
		
		/*
		*	Access core js via your JS function name
		*/
		
		$this->access_corejs('lumise_addon_mydesigns');
		
		/*
		*	Action ajax
		*/
		
		$lumise->add_action('addon-ajax', array(&$this, 'ajax_action'));
		
		/*
		*	Insert your code like css, js into header or footer
		*/
		
		$lumise->add_action('editor-header', array(&$this, 'editor_header'));
		$lumise->add_action('editor-footer', array(&$this, 'editor_footer'));
				
	}
	
	public function ajax_action() {
		
		global $lumise;
		
		$user_id = get_current_user_id();
		$comp = isset($_POST['component']) ? $_POST['component'] : (isset($_GET['component']) ? $_GET['component'] : '');
		$task = isset($_POST['task']) ? $_POST['task'] : (isset($_GET['task']) ? $_GET['task'] : '');
		$_id = isset($_POST['id']) ? $_POST['id'] : (isset($_GET['id']) ? $_GET['id'] : '');
		$_s = isset($_POST['s']) ? $_POST['s'] : (isset($_GET['s']) ? $_GET['s'] : '');
		$_index = isset($_POST['index']) ? $_POST['index'] : (isset($_GET['index']) ? $_GET['index'] : '');
		$perpage = isset($_POST['limit']) ? (Int)$_POST['limit'] : 8;
		$name = urldecode(isset($_POST['name']) ? $_POST['name'] : (isset($_GET['name']) ? $_GET['name'] : ''));
		
		if ($comp != 'mydesigns')
			return;
		
			//hash : e2eaa02a68001c7dac59221d7737866a
		if ($user_id === 0 && $task != 'login'){
			echo 'login';
			return;
			die();
		}
			
		if ($task == 'list') {	
			
			$db = $lumise->get_db();
			
			$query = 'SELECT SQL_CALC_FOUND_ROWS * FROM `'.$db->prefix.'mydesigns`';
			$where = array('active = 1 AND user_id = '.intval($user_id).' ');
			
			if (!empty($_s)) {
				$_s = urldecode($_s);
				$_s = str_replace(array('"', "'", '%', '`'), array(''), $_s);
				array_push($where, "`name` LIKE '%$_s%'");
			}
	        
	        $query .= ' WHERE '.implode(' AND ', $where);
	        
	        $query .= ' ORDER BY `updated` DESC';
	        // $query .= ' LIMIT '.$_index.', '.$perpage;
	        $items = $db->rawQuery($query);
	        $total = $db->rawQuery("SELECT FOUND_ROWS() AS count");
	        
	        if (count($total) > 0 && isset($total[0]['count'])) {
				$total = $total[0]['count'];
			} else $total = 0;
		
			echo json_encode(array($items, $total, $perpage));
			return;
			
		} 
		else if ($task == 'upload_design') {
			
			$check = $lumise->check_upload(time());
		
			if ($check !== 1) {
				echo '{"error": "'.$check.'"}';
				return;
			}
			
			$path = 'user_uploads'.date(DS.'Y'.DS.'m'.DS);
			
			$data = @file_get_contents($_FILES["data"]["tmp_name"]);
			$data = json_decode($data);
			
			$created = @date ("Y-m-d H:i:s");
			$updated = $created;
			
			if (!empty($_id) && $_id != 'new') {
				$item = $lumise->db->rawQuery("SELECT * FROM `{$lumise->db->prefix}mydesigns` WHERE `user_id`='$user_id' AND `did`='$_id'");
				if (isset($item) && isset($item[0])) {
					$id = $_id;
					@unlink($lumise->cfg->upload_path.$item[0]['upload']);
				} else {
					echo 'Unauthorized';
					return;
				}
			} else $id = $lumise->generate_id();
			
			$screen = $lumise->lib->upload_bimage($data->screenshot, $lumise->cfg->upload_path.$path.$id);
			
			unset($data->screenshot);
			
			$lumi = @file_put_contents($lumise->cfg->upload_path.$path.$id.'.lumi', $lumise->lib->enjson($data));
			
			if ($screen['success'] !== 1) {
				echo $screen['msg'];
			} else if (!$lumi) {
				echo 'Could not save the design';
			} else {
				
				if ($_id == 'new') {
					
					$prod = isset($_GET['prod']) ? (Int)$_GET['prod'] : 0;
					$prod_cms = isset($_GET['prod_cms']) ? (Int)$_GET['prod_cms'] : 0;
					
					$lumise->db->insert ('mydesigns', array(
						'did' => $id,
						'name' => $name,
						'product' => $prod,
						'product_cms' => $prod_cms,
						'upload' => $path.$id.'.lumi',
						'screenshot' => 'user_uploads'.date('/Y/m/').$id.$screen['type'],
						'active' => 1,
						'user_id' => $user_id,
						'created' => $created,
						'updated' => $updated
					));
					
				} else {
					$lumise->db->where('did', $id);
					$lumise->db->update('mydesigns', array(
						'updated' => $updated
					));
				}
				
				echo 1;
				return;
				
			}
			
		} else if ($task == 'edit_name') {
			
			$updated = @date ("Y-m-d H:i:s");
			
			$lumise->db->where('did', $_id);
			$lumise->db->update('mydesigns', array(
				'updated' => $updated,
				'name' => $name
			));
			echo 1;
			
			return;
			
		} else if ($task == 'edit_design') {
			
			$item = $lumise->db->rawQuery("SELECT * FROM `{$lumise->db->prefix}mydesigns` WHERE `user_id`='$user_id' AND `did`='$_id'");
			if (isset($item) && isset($item[0])) {
				
				// Get product data + my design data
				$product = $lumise->lib->get_product($item[0]['product']);
				
				if ($product === null || empty($item[0]['upload']) || !is_file($lumise->cfg->upload_path.$item[0]['upload'])) {
					echo 0; return;
				}
				
				$product['templates'] = array();
				$product['mydesign'] = file_get_contents($lumise->cfg->upload_path.$item[0]['upload']);
				
				header('Content-Type: application/json');
				echo json_encode($product);
				
				return;
				 
			} else {
				echo 0;return;
			}
			
		} else if ($task == 'delete') {
			
			$item = $lumise->db->rawQuery("SELECT * FROM `{$lumise->db->prefix}mydesigns` WHERE `user_id`='$user_id' AND `did`='$_id'");
			
			if (isset($item) && isset($item[0])) {
				
				@unlink($lumise->cfg->upload_path.$item[0]['screenshot']);
				@unlink($lumise->cfg->upload_path.$item[0]['upload']);
				
				$lumise->db->where('did', $_id);
				$lumise->db->delete('mydesigns');
				
				echo 1;
				return;
			}
			
			echo 0;
			return;
			
		}else if ($task == 'login') {
			
			$creds = array();
			$creds['user_login'] = $lumise->lib->dejson($_POST['user']);
			$creds['user_password'] = $lumise->lib->dejson($_POST['pass']);
			$creds['remember'] = true;
			
			$user = wp_signon( $creds, false );
			
			if (is_wp_error($user))
				echo $user->get_error_message();
			else echo 1;
			
			return;
			
		}
	}
	
	public function editor_header() {
		
		if (!$this->is_backend()) 
			echo '		<link rel="stylesheet" href="'.$this->get_url('assets/css/mydesigns.css?ver=1').'" type="text/css" media="all" />';
		
	}
	
	public function editor_footer() {
		
		global $lumise;
		
		if (!$this->is_backend()) {
			echo '<script type="text/javascript">var lumise_mydesigns_addon_cfg = {
				s1: "'.$lumise->lang('User login').'",
				s2: "'.$lumise->lang('Username').'",
				s3: "'.$lumise->lang('Password').'",
				s4: "'.$lumise->lang('Login').'",
				s5: "'.$lumise->lang('Register').'",
				reglink: "'.wp_registration_url().'"
			}</script>';
			echo '<script type="text/javascript" src="'.$this->get_url('assets/js/mydesigns.js?ver=1').'"></script>';
		}
	}
		
	/*
		Actions on active or deactive this addon
	*/
	
	static function active() {
		
		global $lumise;
		
		$lumise->db->rawQuery("CREATE TABLE  IF NOT EXISTS `".$lumise->db->prefix."mydesigns` (
			`id` int(11) NOT NULL,
			`did` varchar(255) CHARACTER SET utf8 NOT NULL,
			`name` varchar(255) CHARACTER SET utf8 NOT NULL,
			`product` int(11) DEFAULT NULL,
			`product_cms` int(11) DEFAULT NULL,
			`upload` text CHARACTER SET utf8,
			`screenshot` text CHARACTER SET utf8,
			`active` int(1) DEFAULT NULL,
			`user_id` int(11) DEFAULT NULL,
			`created` datetime DEFAULT NULL,
			`updated` datetime DEFAULT NULL
			) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;");
		
		$lumise->db->rawQuery("ALTER TABLE `".$lumise->db->prefix."mydesigns` ADD PRIMARY KEY (`id`);");
		$lumise->db->rawQuery("ALTER TABLE `".$lumise->db->prefix."mydesigns` CHANGE `id` `id` INT(11) NOT NULL AUTO_INCREMENT;");
		
	}
	
}