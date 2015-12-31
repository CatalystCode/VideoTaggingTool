



INSERT INTO [dbo].[Roles]
           ([Id]
		   ,[Name]
           ,[Description])
     VALUES
           (1
		   ,'Editor'
           ,'Edit vidoes')
GO


INSERT INTO [dbo].[Roles]
           ([Id]
		   ,[Name]
           ,[Description])
     VALUES
           (2
		   ,'Admin'
           ,'Administrator')
GO


INSERT INTO [dbo].[Users]
           ([Name]
           ,[Email]
           ,[RoleId])
     VALUES
           ('Ami'
           ,'ami.turgman@gmail.com'
           ,2)


INSERT INTO [dbo].[Users]
           ([Name]
           ,[Email]
           ,[RoleId])
     VALUES
           ('Uzi'
           ,'uzi@microsoft.com'
           ,1)


INSERT INTO [dbo].[Users]
           ([Name]
           ,[Email]
           ,[RoleId])
     VALUES
           ('Limor'
           ,'limorl@microsoft.com'
           ,2)

GO


INSERT INTO [dbo].[JobStatus]
           ([Id]
           ,[Name]
           ,[Description])
     VALUES
           (1
           ,'Active'
           ,'Job is Active')
GO

INSERT INTO [dbo].[JobStatus]
           ([Id]
           ,[Name]
           ,[Description])
     VALUES
           (2
           ,'Pending'
           ,'Job is Pending')
GO

INSERT INTO [dbo].[JobStatus]
           ([Id]
           ,[Name]
           ,[Description])
     VALUES
           (3
           ,'Approved'
           ,'Job is Approved')
GO