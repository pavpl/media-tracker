import React from 'react';
import { AppBar, Toolbar, Typography, Button, IconButton, Drawer, List, ListItem, ListItemText, useMediaQuery, useTheme } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { Link } from 'react-router-dom';

const Navbar: React.FC = () => {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { text: 'Фильмы', path: '/movies' },
    { text: 'Игры', path: '/games' },
    { text: 'Книги', path: '/books' },
    { text: 'Профиль', path: '/profile' },
  ];

  const drawer = (
    <List>
      {menuItems.map((item) => (
        <ListItem button key={item.text} component={Link} to={item.path} onClick={handleDrawerToggle}>
          <ListItemText primary={item.text} />
        </ListItem>
      ))}
    </List>
  );

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" component={Link} to="/" sx={{ flexGrow: 1, textDecoration: 'none', color: 'inherit' }}>
            Media Tracker
          </Typography>
          {!isMobile && menuItems.map((item) => (
            <Button
              key={item.text}
              color="inherit"
              component={Link}
              to={item.path}
            >
              {item.text}
            </Button>
          ))}
        </Toolbar>
      </AppBar>
      <Drawer
        variant="temporary"
        anchor="left"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
};

export default Navbar; 