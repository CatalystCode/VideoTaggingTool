



INSERT INTO [dbo].[Roles]
           ([Id]
		   ,[Name]
           ,[Description])
     VALUES
           (1
		   ,'Editor'
           ,'Edit videos')
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
           ,'last3876@gmail.com'
           ,2)


INSERT INTO [dbo].[Users]
           ([Name]
           ,[Email]
           ,[RoleId])
     VALUES
           ('Limor'
           ,'limorlimon@gmail.com'
           ,2)


INSERT INTO [dbo].[Users]
           ([Name]
           ,[Email]
           ,[RoleId])
     VALUES
           ('Nitay'
           ,'nitaym@gmail.com'
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